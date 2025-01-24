import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('POST /api/categories received');
  try {
    const body = await request.json();
    console.log('Request body:', body);

    const { name } = body;
    
    if (!name || typeof name !== 'string') {
      console.log('Invalid category data:', { name });
      return NextResponse.json(
        { error: 'Category name is required and must be a string' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return NextResponse.json(
        { error: 'Category name cannot be empty' },
        { status: 400 }
      );
    }

    // Check if category already exists (case insensitive)
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive'
        }
      }
    });

    if (existingCategory) {
      console.log('Category already exists:', existingCategory);
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 400 }
      );
    }

    // Create new category
    console.log('Creating new category:', trimmedName);
    const newCategory = await prisma.category.create({
      data: {
        name: trimmedName,
      }
    });
    console.log('Created category:', newCategory);

    return NextResponse.json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { category: string } }
) {
  console.log('DELETE /api/categories received', params);
  try {
    const category = decodeURIComponent(params.category);
    
    const deletedCategory = await prisma.category.delete({
      where: {
        name: category
      }
    });

    console.log('Deleted category:', deletedCategory);
    return NextResponse.json(deletedCategory);
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
} 