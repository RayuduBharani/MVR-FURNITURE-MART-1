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
    <Card className="p-6 border-0 shadow-sm bg-white">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Add Items</h2>
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-700">Search Products</Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Type product name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 border-gray-300"
            />
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-20 left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {searchResults.map((product) => (
                <button
                  key={product._id}
                  onClick={() => onSelectProduct(product)}
                  className="w-full text-left px-4 py-2 hover:bg-orange-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-600">
                    ₹{product.sellingPrice} • Stock: {product.stock}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Product Display */}
        {selectedProduct && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                <p className="text-sm text-gray-600">₹{selectedProduct.sellingPrice} each</p>
                <p className="text-sm text-gray-600">Available: {selectedProduct.stock} units</p>
              </div>
              <button
                onClick={onClearProduct}
                className="p-1 hover:bg-orange-200 rounded transition-colors"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedProduct.stock}
                  value={quantity}
                  onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
                  className="mt-1 border-gray-300"
                />
              </div>
              <Button
                onClick={onAddToCart}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
