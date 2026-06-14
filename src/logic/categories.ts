import type { Category } from '../types';

export interface CategoryTreeNode extends Category {
  children: Category[];
}

export function buildCategoryTree(categories: Category[]) {
  const active = categories.filter((category) => !category.removedAt);
  const parents = active
    .filter((category) => !category.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const childrenByParent = active.reduce<Record<string, Category[]>>((acc, category) => {
    if (!category.parentId) return acc;
    acc[category.parentId] = [...(acc[category.parentId] ?? []), category];
    return acc;
  }, {});

  return parents.map<CategoryTreeNode>((parent) => ({
    ...parent,
    children: (childrenByParent[parent.id] ?? []).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
  }));
}

export function childrenForParent(categories: Category[], parentId: string) {
  return categories
    .filter((category) => !category.removedAt && category.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function categoryDisplayName(categories: Category[], categoryId?: string | null) {
  if (!categoryId) return null;
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return null;
  const parent = category.parentId ? categories.find((item) => item.id === category.parentId) : null;
  return parent ? `${parent.name} -> ${category.name}` : category.name;
}

export function firstParentForType(categories: Category[], type: Category['type']) {
  return categories
    .filter((category) => !category.parentId && !category.removedAt && category.type === type)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))[0];
}
