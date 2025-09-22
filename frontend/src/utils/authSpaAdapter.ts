
export function createAuthIframe(endpoint: string): Promise<boolean> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.position = 'absolute';
    iframe.style.top = '-999px';
    iframe.style.left = '-999px';
    iframe.src = endpoint;
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'auth_complete') {
        window.removeEventListener('message', handleMessage);
        document.body.removeChild(iframe);
        resolve(event.data.success === true);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    document.body.appendChild(iframe);
    
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
        resolve(false);
      }
    }, 30000); 
  });
}


export function initAuthListener() {
  if (window.opener) {
    window.opener.postMessage({ type: 'auth_complete', success: true }, window.location.origin);
  } else if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'auth_complete', success: true }, window.location.origin);
  }
}