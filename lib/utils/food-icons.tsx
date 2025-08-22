import { Leaf, Wheat, Milk, Utensils } from 'lucide-react';

export function getFoodIcon(prefId: string, isSelected: boolean, isDeclined: boolean = false) {
  const whiteClass = "h-4 w-4 text-white";
  const defaultClass = "h-4 w-4";
  const graySelectedClass = "h-4 w-4 text-gray-200"; // For selected + declined
  const grayUnselectedClass = "h-4 w-4 text-gray-400"; // For unselected + declined
  
  if (isDeclined) {
    // For declined guests, use appropriate icons with gray colors
    switch (prefId.toLowerCase()) {
      case 'vegetarian': 
        return <Leaf className={isSelected ? graySelectedClass : grayUnselectedClass} />;
      case 'vegan': 
        return <Leaf className={isSelected ? graySelectedClass : grayUnselectedClass} />;
      case 'gluten_free': 
      case 'gluten-free': 
        return <Wheat className={isSelected ? graySelectedClass : grayUnselectedClass} />;
      case 'dairy_free': 
      case 'dairy-free': 
        return <Milk className={isSelected ? graySelectedClass : grayUnselectedClass} />;
      case 'none': 
      case 'no_restrictions': 
        return <Utensils className={isSelected ? graySelectedClass : grayUnselectedClass} />;
      default: 
        return <Utensils className={isSelected ? graySelectedClass : grayUnselectedClass} />;
    }
  }
  
  // Normal colors for non-declined guests
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