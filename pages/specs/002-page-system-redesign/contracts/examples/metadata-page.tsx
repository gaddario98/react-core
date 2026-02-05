/**
 * Example: Page with Dynamic Metadata
 *
 * Demonstrates dynamic metadata that updates based on query data.
 * Includes SEO tags, Open Graph, structured data (JSON-LD), and AI hints.
 *
 * @example Use case: Product detail page with rich SEO metadata
 */

import { PageProps } from "../PageProps";
import { QueryDefinition } from "@gaddario98/react-queries";

/**
 * Product data type
 */
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  category: string;
  rating: number;
  reviewCount: number;
  availability: "in_stock" | "out_of_stock";
  brand: string;
}

/**
 * Form fields (for product inquiry)
 */
interface ProductInquiryForm {
  customerName: string;
  customerEmail: string;
  inquiryMessage: string;
}

/**
 * Queries
 */
type ProductQueries = [
  QueryDefinition<"getProduct", "query", { productId: string }, Product, any>,
  QueryDefinition<"submitInquiry", "mutation", ProductInquiryForm, { success: boolean }, any>
];

/**
 * Page configuration with dynamic metadata
 */
export const metadataPageConfig: PageProps<ProductInquiryForm, ProductQueries> = {
  id: "product-detail-page",
  ns: "products",

  /**
   * Query: Fetch product data
   */
  queries: [
    {
      type: "query",
      key: "getProduct",
      queryConfig: {
        enabled: true,
        staleTime: 10 * 60 * 1000, // 10 minutes
      },
    },
    {
      type: "mutation",
      key: "submitInquiry",
      mutationConfig: {
        onSuccess: () => alert("Inquiry submitted successfully!"),
      },
    },
  ],

  /**
   * Form: Product inquiry
   */
  form: {
    fields: [
      { name: "customerName", type: "text", label: "Your Name", required: true },
      { name: "customerEmail", type: "email", label: "Your Email", required: true },
      { name: "inquiryMessage", type: "textarea", label: "Your Question" },
    ],
    defaultValues: {
      customerName: "",
      customerEmail: "",
      inquiryMessage: "",
    },
  },

  /**
   * Content: Product details
   */
  contents: (mappedProps) => {
    const product = mappedProps.allQuery.getProduct?.data;

    if (mappedProps.allQuery.getProduct?.isLoading) {
      return [{ type: "custom", component: <div>Loading product...</div> }];
    }

    if (!product) {
      return [{ type: "custom", component: <div>Product not found</div> }];
    }

    return [
      {
        type: "custom",
        component: (
          <div className="product-detail">
            <img src={product.imageUrl} alt={product.name} style={{ width: "100%" }} />
            <h1>{product.name}</h1>
            <p className="price">
              {product.currency} {product.price}
            </p>
            <p className="rating">
              Rating: {product.rating}/5 ({product.reviewCount} reviews)
            </p>
            <p className="description">{product.description}</p>
            <p className="availability">
              {product.availability === "in_stock" ? "In Stock" : "Out of Stock"}
            </p>
          </div>
        ),
        usedQueries: ["getProduct"],
        key: "product-detail",
      },
      {
        type: "custom",
        component: (
          <button
            onClick={() => {
              mappedProps.allMutation.submitInquiry.mutate({
                customerName: mappedProps.formValues.customerName,
                customerEmail: mappedProps.formValues.customerEmail,
                inquiryMessage: mappedProps.formValues.inquiryMessage,
              });
            }}
          >
            Submit Inquiry
          </button>
        ),
        usedFormValues: ["customerName", "customerEmail", "inquiryMessage"],
        key: "submit-button",
      },
    ];
  },

  /**
   * METADATA: Dynamic metadata from query data
   *
   * This is the core feature of this example.
   * Metadata updates automatically when product query loads.
   */
  meta: {
    /**
     * Dynamic title from product name
     */
    title: (mappedProps) => {
      const product = mappedProps.allQuery.getProduct?.data;
      return product ? `${product.name} - Buy Now | Our Store` : "Product Details";
    },

    /**
     * Dynamic description from product description
     */
    description: (mappedProps) => {
      const product = mappedProps.allQuery.getProduct?.data;
      return product
        ? product.description.substring(0, 160) // Truncate to 160 chars for SEO
        : "Shop our amazing products at great prices";
    },

    /**
     * Keywords from product data
     */
    keywords: (mappedProps) => {
      const product = mappedProps.allQuery.getProduct?.data;
      return product
        ? [product.name, product.brand, product.category, "buy", "shop"]
        : ["products", "shop", "buy"];
    },

    /**
     * Document language
     */
    documentLang: "en",

    /**
     * Open Graph for social media sharing
     */
    openGraph: {
      type: "product",
      title: (mappedProps) => {
        const product = mappedProps.allQuery.getProduct?.data;
        return product?.name || "Product";
      },
      description: (mappedProps) => {
        const product = mappedProps.allQuery.getProduct?.data;
        return product?.description || "Check out this amazing product!";
      },
      image: (mappedProps) => {
        const product = mappedProps.allQuery.getProduct?.data;
        return product?.imageUrl || "https://example.com/default-product.jpg";
      },
      url: (mappedProps) => {
        const product = mappedProps.allQuery.getProduct?.data;
        return product
          ? `https://example.com/products/${product.id}`
          : "https://example.com/products";
      },
      siteName: "Our Store",
      locale: "en_US",
    },

    /**
     * Structured data (JSON-LD) for search engines
     */
    structuredData: {
      type: "Product",
      schema: (mappedProps) => {
        const product = mappedProps.allQuery.getProduct?.data;

        if (!product) {
          return {
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Product",
          };
        }

        return {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          image: product.imageUrl,
          brand: {
            "@type": "Brand",
            name: product.brand,
          },
          offers: {
            "@type": "Offer",
            price: product.price.toString(),
            priceCurrency: product.currency,
            availability:
              product.availability === "in_stock"
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.toString(),
            reviewCount: product.reviewCount,
          },
        };
      },
    },

    /**
     * AI Crawler Hints
     */
    aiHints: {
      contentClassification: "product-listing",
      modelHints: ["e-commerce", "product-detail", "shoppable"],
      contextualInfo: (mappedProps) => {
        const product = mappedProps.allQuery.getProduct?.data;
        return product
          ? `This is a product page for ${product.name}, a ${product.category} product sold by ${product.brand}. Users can view details and submit inquiries.`
          : "Product detail page";
      },
    },

    /**
     * Robots meta tags
     */
    robots: {
      noindex: false, // Allow indexing
      nofollow: false, // Follow links
      maxImagePreview: "large", // Allow large image previews
    },
  },

  /**
   * View settings
   */
  viewSettings: {
    withoutPadding: false,
  },
};

/**
 * Usage:
 *
 * ```tsx
 * import { PageGenerator } from '@gaddario98/react-pages';
 * import { metadataPageConfig } from './metadata-page';
 *
 * function ProductDetailPage({ productId }: { productId: string }) {
 *   // Override query config to pass productId
 *   const config = {
 *     ...metadataPageConfig,
 *     queries: [
 *       {
 *         ...metadataPageConfig.queries[0],
 *         queryConfig: {
 *           ...metadataPageConfig.queries[0].queryConfig,
 *           queryKey: ['getProduct', productId],
 *         }
 *       },
 *       metadataPageConfig.queries[1]
 *     ]
 *   };
 *
 *   return <PageGenerator {...config} />;
 * }
 * ```
 */

/**
 * Metadata Lifecycle:
 *
 * 1. Initial Render (before query loads):
 *    - title: "Product Details" (fallback)
 *    - description: "Shop our amazing products at great prices" (fallback)
 *    - openGraph.image: default image
 *    - structuredData: minimal schema
 *
 * 2. After Query Loads:
 *    - title: "Amazing Widget - Buy Now | Our Store" (from product.name)
 *    - description: "This amazing widget will change your life..." (from product.description)
 *    - openGraph.image: product.imageUrl (actual product image)
 *    - structuredData: complete Product schema with price, rating, availability
 *
 * 3. Search Engine Results:
 *    - Title: "Amazing Widget - Buy Now | Our Store"
 *    - Snippet: "This amazing widget will change your life..."
 *    - Rich result: Product card with image, price, rating, availability
 *
 * 4. Social Media Share:
 *    - Preview image: Actual product image
 *    - Title: "Amazing Widget"
 *    - Description: Full product description
 */

/**
 * Performance Considerations:
 *
 * - Metadata updates trigger document.head modifications (DOM mutations)
 * - Updates are synchronous and happen in useEffect
 * - Metadata is memoized - only updates when query data actually changes
 * - On React Native, metadata calls are no-ops (graceful degradation)
 */

/**
 * SEO Impact:
 *
 * **Without dynamic metadata** (1.x):
 * - All product pages have same title: "Product Details"
 * - Same description for all products
 * - No Open Graph images → generic share previews
 * - No structured data → plain search results
 *
 * **With dynamic metadata** (2.x):
 * - Unique title per product
 * - Product-specific descriptions
 * - Actual product images in shares
 * - Rich search results with price, rating, availability
 * - AI search engines understand product context
 *
 * **Expected Impact**:
 * - 30-50% increase in click-through rate from search
 * - Higher social media engagement (image + description)
 * - Better ranking for long-tail keywords (product names)
 */
