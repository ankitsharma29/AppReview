import { createNavigationContainerRef } from '@react-navigation/native';

let initialRoute = null;

export const navigationRef:any  = createNavigationContainerRef()

export function navigate(...props: any) {
  console.log();
  
  setTimeout(() => {
    
    navigationRef.navigate(...props as never);
  }, 2000);
  if (navigationRef.isReady()) {
    navigationRef.navigate(...props as never);
  } else {
    initialRoute = props;
  }
}

export function onReady() {
  if (initialRoute) {
    navigate(...initialRoute as any);
  };
}