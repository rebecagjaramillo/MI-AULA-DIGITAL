export const getForgotPasswordTemplate = (resetUrl) => {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; font-family: 'Arial', sans-serif; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="100%" max-width="600px" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <tr>
              <td align="center">
                <h1 style="color: #1e293b; margin-top: 0;">¿Olvidaste tu contraseña?</h1>
                <p style="color: #64748b; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                  Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Mi Aula Digital</strong>. Si no has sido tú, puedes ignorar este correo de forma segura.
                </p>
                
                <a href="${resetUrl}" 
                   style="background-color: #0284c7; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                   Restablecer contraseña
                </a>

                <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
                  Este enlace caducará en 1 hora por tu seguridad.
                </p>
              </td>
            </tr>
          </table>
          
          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
            Mi Aula Digital &copy; 2026. Todos los derechos reservados.
          </p>
        </td>
      </tr>
    </table>
  `;
};
