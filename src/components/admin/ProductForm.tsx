import React, { useState, useEffect } from 'react';
import { useProductStore } from '../../store/productStore';
import { Product } from '../../types';

interface Category {
  id: string | number;
  name: string;
  productCount?: number;
}

interface FormData {
  name: string;
  description: string;
  shortDescription: string;
  sku: string;
  brand: string;
  categoryId: string | number;
  price: number;
  compareAtPrice: number;
  featured: boolean;
  status: 'active' | 'inactive' | 'discontinued';
  tags: string[];
  inventory: {
    quantity: number;
    lowStockThreshold: number;
    status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'backorder';
    trackQuantity: boolean;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
  };
}

interface ProductFormProps {
  product?: Product;
  onClose: () => void;
}

interface FormData {
  name: string;
  description: string;
  shortDescription: string;
  sku: string;
  brand: string;
  categoryId: string;
  price: number;
  compareAtPrice: number;
  featured: boolean;
  status: 'active' | 'inactive' | 'draft';
  tags: string[];
  inventory: {
    quantity: number;
    lowStockThreshold: number;
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
    trackQuantity: boolean;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
  };
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onClose }) => {
  const { categories, fetchCategories, isLoading: isCategoriesLoading } = useProductStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [images, setImages] = useState<Array<{ id: string; url: string; alt: string }>>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    shortDescription: '',
    sku: '',
    brand: '',
    categoryId: '',
    price: 0,
    compareAtPrice: 0,
    featured: false,
    status: 'active',
    tags: [],
    inventory: {
      quantity: 0,
      lowStockThreshold: 5,
      status: 'in_stock',
      trackQuantity: true
    },
    seo: {
      title: '',
      description: '',
      keywords: [],
      slug: ''
    }
  });
  
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription || '',
        sku: product.sku,
        brand: product.brand,
        categoryId: product.categoryId ? String(product.categoryId) : '',
        price: product.price,
        compareAtPrice: product.compareAtPrice || 0,
        featured: product.featured || false,
        status: product.status || 'active',
        tags: product.tags || [],
        inventory: {
          quantity: product.inventory?.quantity || 0,
          lowStockThreshold: product.inventory?.lowStockThreshold || 5,
          status: product.inventory?.status || 'in_stock',
          trackQuantity: product.inventory?.trackQuantity !== false
        },
        seo: {
          title: product.seo?.title || '',
          description: product.seo?.description || '',
          keywords: product.seo?.keywords || [],
          slug: product.seo?.slug || ''
        }
      });
    }
  }, [product]);
  
  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
      categoryId: updates.categoryId !== undefined ? String(updates.categoryId) : prev.categoryId
    }));
  };

  useEffect(() => {
    console.log('ProductForm mounted, fetching categories...');
    const loadCategories = async () => {
      try {
        await fetchCategories();
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setErrors(prev => ({
          ...prev,
          categories: 'Failed to load categories. Please try again.'
        }));
      }
    };
    loadCategories();
  }, [fetchCategories]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: type === 'number' ? parseFloat(value) || 0 : value
        }
      }));
    } else {
      const newValue = type === 'number' ? parseFloat(value) || 0 :
                    type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                    type === 'select-one' ? String(value) :
                    value;
      
      updateFormData({ [name]: newValue } as any);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== Form Submission Started ===');
    console.log('Form data:', formData);
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      console.log('Form validation failed');
      return;
    }
    
    if (isCategoriesLoading) {
      console.log('Categories are still loading');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const categoryId = String(formData.categoryId);
      console.log('Looking for category with ID:', { 
        formCategoryId: categoryId,
        rawValue: formData.categoryId
      });
      
      const selectedCategory = categories.find(cat => {
        const catId = String(cat.id);
        const matches = catId == categoryId; // Loose equality for type coercion
        
        console.log('Checking category:', { 
          categoryId: catId, 
          formCategoryId: categoryId,
          name: cat.name,
          matches,
          types: {
            category: typeof cat.id,
            form: typeof formData.categoryId
          }
        });
        
        return matches;
      });
      
      if (!selectedCategory) {
        console.error('Category not found. Available categories:', 
          categories.map(c => ({
            id: c.id, 
            idString: String(c.id),
            name: c.name,
            type: typeof c.id,
            matches: String(c.id) === String(formData.categoryId)
          }))
        );
        
        setErrors(prev => ({
          ...prev, 
          categoryId: `Selected category not found. Please select a valid category.`
        }));
        return;
      }
      
      const productData = {
        ...formData,
        categoryId: selectedCategory.id, // Use the category ID from the found category
        price: Number(formData.price),
        compareAtPrice: Number(formData.compareAtPrice) || undefined,
        images: [], // Add images if needed
        specifications: [], // Add specifications if needed
        compatibility: [] // Add compatibility if needed
      };
      
      console.log('Submitting product data:', productData);
      
      // Here you would typically call your API to save the product
      // await (product ? updateProduct(product.id, productData) : addProduct(productData));
      
      console.log('Product saved successfully');
      onClose();
      
    } catch (error) {
      console.error('Error saving product:', error);
      setErrors(prev => ({
        ...prev,
        form: 'Failed to save product. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {product ? 'Edit Product' : 'Create New Product'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {errors.form && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {errors.form}
            </div>
          )}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {product ? 'Edit Product' : 'Create New Product'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {errors.form && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {errors.form}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter product name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            
            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.sku ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter SKU"
              />
              {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
            </div>
            
            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand *
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.brand ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter brand name"
              />
              {errors.brand && <p className="mt-1 text-sm text-red-600">{errors.brand}</p>}
            </div>
            
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <div className="relative">
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={(e) => {
                    console.log('Category selected - raw value:', e.target.value, 'type:', typeof e.target.value);
                    updateFormData({ categoryId: e.target.value });
                    if (errors.categoryId) {
                      setErrors(prev => ({
                        ...prev,
                        categoryId: ''
                      }));
                    }
                  }}
                  disabled={isCategoriesLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.categoryId ? 'border-red-300' : 'border-gray-300'
                  } ${isCategoriesLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">
                    {isCategoriesLoading ? 'Loading categories...' : 'Select a category'}
                  </option>
                  {categories.map(category => {
                    const categoryId = String(category.id);
                    return (
                      <option 
                        key={categoryId}
                        value={categoryId}
                      >
                        {category.name} {category.productCount ? `(${category.productCount} products)` : ''}
                      </option>
                    );
                  })}
                </select>
                {isCategoriesLoading && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
              {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
            </div>
            
            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`block w-full pl-7 pr-12 sm:text-sm border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.price ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>
            
            {/* Compare At Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compare At Price
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="compareAtPrice"
                  value={formData.compareAtPrice}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="block w-full pl-7 pr-12 sm:text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter detailed product description"
              />
            </div>
            
            {/* Short Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description
              </label>
              <textarea
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter short description for product cards"
              />
            </div>
            
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            
            {/* Featured */}
            <div className="flex items-center">
              <div className="flex items-center h-5">
                <input
                  id="featured"
                  name="featured"
                  type="checkbox"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="featured" className="font-medium text-gray-700">
                  Featured Product
                </label>
                <p className="text-gray-500">This product will appear in featured sections</p>
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="mt-8 pt-5 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex h-[calc(90vh-140px)]">
            {/* Main Form */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-6">
                  {/* Error Display */}
                  {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                          <p className="text-sm text-red-800">{errors.general}</p>
                        </div>
                      </div>
                    </div>
                  onClose={() => setShowAlibabaImport(false)}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProductForm;