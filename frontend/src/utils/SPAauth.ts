
export interface ReplitAuthUser {
  id: string;
  name: string;
  bio: string | null;
  url: string | null;
  profileImage: string | null;
  username: string;
  firstName: string | null;
  lastName: string | null;
  isLoggedIn: boolean;
  roles: string[];
}

export function openReplitAuthPopup(width = 500, height = 600): { 
  popup: Window | null; 
  authPromise: Promise<boolean>;
} {
  
  const left = (window.innerWidth - width) / 2 + window.screenX;
  const top = (window.innerHeight - height) / 2 + window.screenY;
  
  const popup = window.open(
    '/api/login', 
    'replit-auth',
    `width=${width},height=${height},left=${left},top=${top},location=yes,menubar=no,toolbar=no,status=no`
  );
  
  const authPromise = new Promise<boolean>((resolve) => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'authorization_complete') {
        window.removeEventListener('message', handleMessage);
        resolve(true);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      resolve(false);
    }, 120000); 
  });
  
  return { popup, authPromise };
}

export async function fetchReplitAuthUser(): Promise<ReplitAuthUser | null> {
  
  try {
    const response = await fetch('/api/auth/user');
    
    
    if (!response.ok) {
      console.error('Failed to fetch user data:', response.statusText);
      return null;
    }
    
    const userData = await response.json();
    
    const replitAuthUser: ReplitAuthUser = {
      id: userData.id,
      name: userData.username,
      username: userData.username,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      bio: userData.bio || null,
      url: null,
      profileImage: userData.profileImageUrl || null,
      isLoggedIn: true,
      roles: []
    };
    
    return replitAuthUser;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}


export function saveUserSession(userData: ReplitAuthUser): void {
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('userName', userData.username);
  localStorage.setItem('userID', userData.id);
  
  const onboardingComplete = localStorage.getItem('onboarding_complete') === 'true';
  localStorage.setItem('onboardingComplete', onboardingComplete ? 'true' : 'false');
}


export function clearUserSession(): void {
  localStorage.setItem('isAuthenticated', 'false');
  localStorage.removeItem('userName');
  localStorage.removeItem('userID');
}


export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem('onboardingComplete') === 'true';
}


export async function performReplitAuth(): Promise<boolean> {
  const { popup, authPromise } = openReplitAuthPopup();
  
  const success = await authPromise;
  
  if (popup && !popup.closed) {
    popup.close();
  }
  
  if (success) {
    const userData = await fetchReplitAuthUser();
    
    if (userData) {
      saveUserSession(userData);
      return true;
    }
  }
  
  return false;
}