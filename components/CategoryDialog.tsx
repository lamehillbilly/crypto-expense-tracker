'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CategoryBadge, categoryColors } from './CategoryBadge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import * as Icons from 'lucide-react';

interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
}

interface CategoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
}

const availableIcons = {
  ShoppingCart: Icons.ShoppingCart,
  Home: Icons.Home,
  Car: Icons.Car,
  Utensils: Icons.Utensils,
  Plane: Icons.Plane,
  Heart: Icons.Heart,
  Book: Icons.Book,
  Coffee: Icons.Coffee,
  Gamepad: Icons.Gamepad,
  Music: Icons.Music,
  Shirt: Icons.Shirt,
  Wrench: Icons.Wrench,
  Dumbbell: Icons.Dumbbell,
  Bus: Icons.Bus,
  Gift: Icons.Gift,
};

// Color options
const colorOptions = [
  { name: 'Blue', value: 'bg-blue-100 text-blue-700 border-blue-200' },
  { name: 'Green', value: 'bg-green-100 text-green-700 border-green-200' },
  { name: 'Yellow', value: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { name: 'Purple', value: 'bg-purple-100 text-purple-700 border-purple-200' },
  { name: 'Red', value: 'bg-red-100 text-red-700 border-red-200' },
  { name: 'Indigo', value: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { name: 'Pink', value: 'bg-pink-100 text-pink-700 border-pink-200' },
  { name: 'Orange', value: 'bg-orange-100 text-orange-700 border-orange-200' },
];

export function CategoryDialog({ open, onClose, onSuccess, categories }: CategoryDialogProps) {
  const [newCategory, setNewCategory] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newCategory.trim(),
          icon: selectedIcon,
          color: selectedColor
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create category');
      }

      toast.success('Category added successfully');
      // Reset form but don't close dialog
      setNewCategory('');
      setSelectedIcon('');
      setSelectedColor('');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete category');

      toast.success('Category deleted successfully');
      onSuccess();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Popover open={showIconPicker} onOpenChange={setShowIconPicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    {selectedIcon && availableIcons[selectedIcon as keyof typeof availableIcons] ? 
                      React.createElement(availableIcons[selectedIcon as keyof typeof availableIcons], { className: 'h-4 w-4' }) 
                      : '+'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-muted">
                  <ScrollArea className="h-full p-4">
                    <div className="grid grid-cols-6 gap-2">
                      {Object.entries(availableIcons).map(([name, Icon]) => (
                        <Button
                          key={name}
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => {
                            setSelectedIcon(name);
                            setShowIconPicker(false);
                          }}
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`h-10 w-10 ${selectedColor || 'bg-background'}`}
                  >
                    <div className="h-4 w-4 rounded" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-muted">
                  <div className="grid grid-cols-4 gap-2 p-2">
                    {colorOptions.map((color) => (
                      <Button
                        key={color.name}
                        variant="outline"
                        size="icon"
                        className={`h-8 w-8 ${color.value}`}
                        onClick={() => {
                          setSelectedColor(color.value);
                          setShowColorPicker(false);
                        }}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name"
                className="flex-1"
              />
              <Button type="submit" disabled={isSubmitting}>
                Add
              </Button>
            </div>
          </form>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Existing Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <CategoryBadge
                  key={category.id}
                  name={category.name}
                  icon={category.icon}
                  color={category.color}
                  onDelete={() => handleDelete(category.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}