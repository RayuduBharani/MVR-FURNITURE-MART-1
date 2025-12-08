'use client';

import { Search, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Product {
  _id: string;
  name: string;
  sellingPrice: number;
  stock: number;
}

interface ProductSearchProps {
  searchQuery: string;
  searchResults: Product[];
  selectedProduct: Product | null;
  quantity: number;
  onSearchChange: (query: string) => void;
  onSelectProduct: (product: Product) => void;
  onClearProduct: () => void;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
}

export default function ProductSearch({
  searchQuery,
  searchResults,
  selectedProduct,
  quantity,
  onSearchChange,
  onSelectProduct,
  onClearProduct,
  onQuantityChange,
  onAddToCart,
}: ProductSearchProps) {
  return (
    <Card className="p-6 shadow-md">
      <h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
        <Search className="h-5 w-5 text-primary" />
        Add Items to Bill
      </h2>
      <div className="space-y-4">
        <div className="relative">
          <Label className="text-sm font-semibold text-foreground mb-2 block">Search Products</Label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Start typing product name to search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 pr-4 h-12 text-base rounded-lg"
            />
          </div>

          {/* Search Results Dropdown - Improved visibility */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-card border-2 border-primary/30 rounded-lg shadow-2xl max-h-80 overflow-y-auto">
              <div className="p-2 bg-primary/10 border-b border-border">
                <p className="text-xs font-semibold text-primary uppercase">
                  {searchResults.length} Product{searchResults.length !== 1 ? 's' : ''} Found
                </p>
              </div>
              {searchResults.map((product) => (
                <button
                  key={product._id}
                  onClick={() => onSelectProduct(product)}
                  className="w-full text-left px-4 py-4 hover:bg-muted/50 border-b border-border last:border-b-0 transition-all hover:shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-base text-foreground mb-1">
                        {product.name}
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-600 dark:text-green-400 font-semibold">
                          ₹{product.sellingPrice.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">
                          Stock: <span className={product.stock > 10 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-yellow-600 dark:text-yellow-400 font-medium'}>
                            {product.stock} units
                          </span>
                        </span>
                      </div>
                    </div>
                    <Plus className="h-5 w-5 text-primary shrink-0 ml-2" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && (
            <div className="mt-2 bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
              <p className="text-sm text-destructive font-medium">
                No products found for &quot;{searchQuery}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Selected Product Display - Enhanced */}
        {selectedProduct && (
          <div className="p-5 bg-primary/10 border-2 border-primary/30 rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="font-bold text-lg text-foreground mb-2">{selectedProduct.name}</p>
                    <div className="space-y-1">
                      <p className="text-base text-green-600 dark:text-green-400 font-semibold">
                        Price: ₹{selectedProduct.sellingPrice.toFixed(2)} per unit
                      </p>
                      <p className={`text-sm font-medium ${selectedProduct.stock > 10 ? 'text-muted-foreground' : 'text-yellow-600 dark:text-yellow-400'}`}>
                        Available Stock: {selectedProduct.stock} units
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={onClearProduct}
                className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0"
                title="Remove product"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label className="text-sm font-semibold text-foreground mb-2 block">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedProduct.stock}
                  value={quantity}
                  onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-11 text-base"
                />
              </div>
              <div className="flex-1">
                <Label className="text-sm font-semibold text-foreground mb-2 block">Subtotal</Label>
                <div className="h-11 px-4 bg-card border-2 border-border rounded-md flex items-center">
                  <span className="text-lg font-bold text-foreground">
                    ₹{(selectedProduct.sellingPrice * quantity).toFixed(2)}
                  </span>
                </div>
              </div>
              <Button
                onClick={onAddToCart}
                className="h-11 px-6 font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
