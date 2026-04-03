export const sendCustomPasswordResetEmail = async (email: string, resetLink: string) => {
  try {
    const response = await fetch('/api/send-reset-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, resetLink }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al enviar el correo');
    }

    return data;
  } catch (error) {
    console.error('Error en sendCustomPasswordResetEmail:', error);
    throw error;
  }
};
