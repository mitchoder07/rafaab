// Currency formatting (Naira) and number helpers

export function formatNaira(amount: number): string {
  return "₦" + Math.round(amount).toLocaleString("en-NG");
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
}

// Check if a product's flash sale is still active (not expired)
export function isFlashActive(product: { isFlashSale: boolean; flashSaleEndsAt: string | null }): boolean {
  if (!product.isFlashSale || !product.flashSaleEndsAt) return false;
  return new Date(product.flashSaleEndsAt).getTime() > Date.now();
}

