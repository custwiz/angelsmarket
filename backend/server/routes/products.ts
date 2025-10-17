import { Router, Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import { ProductModel } from "../models/Product";

const router = Router();

interface ProductRequestBody {
  sku?: string;
  name?: string;
  description?: string;
  detailedDescription?: string;
  detailed_description?: string;
  price?: number | string;
  originalPrice?: number | string;
  original_price?: number | string;
  image?: string;
  rating?: number | string;
  benefits?: string[] | string;
  benefitsList?: string[] | string;
  specifications?: Record<string, unknown>;
  category?: string;
  inStock?: boolean | string;
  in_stock?: boolean | string;
  featured?: boolean | string;
  availableQuantity?: number | string;
  available_quantity?: number | string;
  tags?: string[] | string;
}

const normalizePayload = (body: ProductRequestBody) => {
  const toNumber = (value: unknown) => {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const toBoolean = (value: unknown, fallback = false) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      if (value.toLowerCase() === "true") return true;
      if (value.toLowerCase() === "false") return false;
    }
    return fallback;
  };

  const toStringArray = (value: unknown) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
    if (typeof value === "string") {
      return value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return [];
  };

  const specifications =
    body.specifications && typeof body.specifications === "object"
      ? Object.entries(body.specifications).reduce<Record<string, string>>((acc, [key, value]) => {
          acc[key] = typeof value === "string" ? value : String(value);
          return acc;
        }, {})
      : {};

  const benefits = body.benefits ?? body.benefitsList;

  const payload: Record<string, unknown> = {
    sku: body.sku,
    name: body.name,
    description: body.description,
    detailedDescription: body.detailedDescription ?? body.detailed_description,
    price: toNumber(body.price),
    originalPrice: toNumber(body.originalPrice ?? body.original_price),
    image: body.image,
    rating: toNumber(body.rating) ?? 5,
    benefits: toStringArray(benefits),
    specifications,
    category: body.category,
    inStock: toBoolean(body.inStock ?? body.in_stock, true),
    featured: toBoolean(body.featured, false),
    availableQuantity: toNumber(body.availableQuantity ?? body.available_quantity) ?? 0,
    tags: toStringArray(body.tags),
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
};

const mapProductDocument = (product: any) => {
  if (!product) return product;
  const id = product.id ?? (typeof product._id === "object" && "toString" in product._id
    ? product._id.toString()
    : product._id);

  return {
    ...product,
    id,
  };
};

router.get("/", async (_req, res, next) => {
  try {
    const products = await ProductModel.find().sort({ createdAt: -1 }).lean();
    res.json(products.map(mapProductDocument));
  } catch (error: unknown) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const product = await ProductModel.findById(req.params.id).lean();
    if (!product) {
      throw new createHttpError.NotFound("Product not found");
    }
    res.json(mapProductDocument(product));
  } catch (error: unknown) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = normalizePayload(req.body);

    if (!payload.sku || !payload.name || !payload.price) {
      throw new createHttpError.BadRequest("Missing required fields: sku, name, price");
    }

    const product = await ProductModel.create(payload);
    res.status(201).json(mapProductDocument(product.toJSON()));
  } catch (error: unknown) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const payload = normalizePayload(req.body);
    const updated = await ProductModel.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      throw new createHttpError.NotFound("Product not found");
    }

    res.json(mapProductDocument(updated.toJSON()));
  } catch (error: unknown) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await ProductModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      throw new createHttpError.NotFound("Product not found");
    }

    res.status(204).send();
  } catch (error: unknown) {
    next(error);
  }
});

router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (createHttpError.isHttpError(error)) {
    return res.status(error.statusCode).json({ message: error.message, details: error });
  }

  console.error("Unhandled product route error", error);
  return res.status(500).json({ message: "Internal server error" });
});

export default router;
