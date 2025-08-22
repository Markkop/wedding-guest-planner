import { Leaf, Wheat, Milk, Utensils } from 'lucide-react';

export function getFoodIcon(prefId: string, isSelected: boolean) {
  const whiteClass = "h-4 w-4 text-white";
  const defaultClass = "h-4 w-4";
  
  switch (prefId.toLowerCase()) {
    case 'vegetarian': 
      return <Leaf className={isSelected ? whiteClass : `${defaultClass} text-green-600`} />;
    case 'vegan': 
      return <Leaf className={isSelected ? whiteClass : `${defaultClass} text-green-700`} />;
    case 'gluten_free': 
    case 'gluten-free': 
      return <Wheat className={isSelected ? whiteClass : `${defaultClass} text-amber-600`} />;
    case 'dairy_free': 
    case 'dairy-free': 
      return <Milk className={isSelected ? whiteClass : `${defaultClass} text-blue-600`} />;
    case 'none': 
    case 'no_restrictions': 
      return <Utensils className={isSelected ? whiteClass : defaultClass} />;
    default: 
      return <Utensils className={isSelected ? whiteClass : defaultClass} />;
  }
}