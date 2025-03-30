import ShoppingBasket from '@mui/icons-material/ShoppingBasket';
import LocalGroceryStore from '@mui/icons-material/LocalGroceryStore';
import Restaurant from '@mui/icons-material/Restaurant';
import LocalCafe from '@mui/icons-material/LocalCafe';
import LocalDrink from '@mui/icons-material/LocalDrink';
import BakeryDining from '@mui/icons-material/BakeryDining';
import LocalPizza from '@mui/icons-material/LocalPizza';
import Icecream from '@mui/icons-material/Icecream';
import LocalPharmacy from '@mui/icons-material/LocalPharmacy';
import Pets from '@mui/icons-material/Pets';
import Spa from '@mui/icons-material/Spa';
import Kitchen from '@mui/icons-material/Kitchen';
import Liquor from '@mui/icons-material/Liquor';
import LocalLaundryService from '@mui/icons-material/LocalLaundryService';
import CleaningServices from '@mui/icons-material/CleaningServices';
import LocalMall from '@mui/icons-material/LocalMall';

// Mapping of grocery items to their icons
export const groceryIcons = {
  // Fruits and Vegetables
  'apple': Spa,
  'banana': Spa,
  'orange': Spa,
  'tomato': Spa,
  'potato': Spa,
  'onion': Spa,
  'carrot': Spa,
  'lettuce': Spa,
  'cucumber': Spa,
  'broccoli': Spa,
  
  // Dairy
  'milk': LocalGroceryStore,
  'cheese': LocalGroceryStore,
  'yogurt': LocalGroceryStore,
  'butter': LocalGroceryStore,
  'cream': LocalGroceryStore,
  
  // Meat and Seafood
  'chicken': Restaurant,
  'beef': Restaurant,
  'fish': Restaurant,
  'pork': Restaurant,
  'lamb': Restaurant,
  
  // Bakery
  'bread': BakeryDining,
  'cake': BakeryDining,
  'cookies': BakeryDining,
  'pastry': BakeryDining,
  
  // Beverages
  'coffee': LocalCafe,
  'tea': LocalCafe,
  'juice': LocalDrink,
  'soda': LocalDrink,
  'water': LocalDrink,
  
  // Snacks
  'chips': LocalPizza,
  'candy': Icecream,
  'chocolate': Icecream,
  'nuts': LocalPizza,
  
  // Household
  'detergent': LocalLaundryService,
  'soap': CleaningServices,
  'paper': LocalMall,
  'cleaning': CleaningServices,
  
  // Default icon for unknown items
  'default': ShoppingBasket
};

// Function to find the most appropriate icon for a given item
export const getGroceryIcon = (item) => {
  const itemLower = item.toLowerCase();
  for (const [key, icon] of Object.entries(groceryIcons)) {
    if (itemLower.includes(key)) {
      return icon;
    }
  }
  return groceryIcons.default;
}; 