import type { Product } from "@/lib/store";

export default function ProductCover({ product, priority = false }: { product: Product; priority?: boolean }) {
  const fallback = product.platform === "Xbox" ? "/design-assets/wild-horizon.png" : product.platform === "PS4" ? "/design-assets/afterlight.png" : "/design-assets/drift-circuit.png";
  return <div className={`game-case ${product.image_url ? "has-image" : `case-${product.platform.toLowerCase()}`}`}>
    <div className="case-strip"><span>{product.platform}</span><span>PHYSICAL</span></div>
    {product.image_url ? <img src={product.image_url} alt={`${product.title} physical game cover`} loading={priority ? "eager" : "lazy"} /> : <div className="case-placeholder" aria-label={`${product.title} concept cover placeholder`}><img src={fallback} alt="" loading={priority ? "eager" : "lazy"} /></div>}
  </div>;
}
