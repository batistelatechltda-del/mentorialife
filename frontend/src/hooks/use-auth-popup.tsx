import { useState, useCallback } from 'react';
import AuthPopup from '../components/AuthPopup';

export function useAuthPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [authType, setAuthType] = useState<string>('login');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [onSuccessCallback, setOnSuccessCallback] = useState<() => void>(() => {});
  
  
  const openPopup = useCallback((
    endpoint: string = 'login', 
    onSuccess: () => void = () => {}, 
    method: 'email' | 'phone' = 'email'
  ) => {
    const isRegister = endpoint.includes('register') || endpoint.includes('signup');
    const isPhone = endpoint.includes('phone');
    
    setAuthType(isRegister ? 'signup' : 'login');
    setAuthMethod(isPhone ? 'phone' : method);
    setOnSuccessCallback(() => onSuccess);
    setIsOpen(true);
    
    localStorage.setItem('authMode', isRegister ? 'new' : 'existing');
    localStorage.setItem('authMethod', isPhone ? 'phone' : method);
    
  }, []);
  
  
  const closePopup = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  const popupComponent = isOpen ? (
    <AuthPopup 
      onClose={closePopup}
      onSuccess={onSuccessCallback}
      authEndpoint={authType}
      initialAuthMethod={authMethod}
    />
  ) : null;
  
  return {
    isOpen,
    openPopup,
    closePopup,
    popupComponent
  };
}