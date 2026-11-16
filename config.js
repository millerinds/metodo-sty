/*
 * Configuração da landing page Método STY.
 * Único ponto a editar antes da publicação.
 *
 * CHECKOUT_URL: link definitivo do checkout da Kiwify (fornecido pela cliente/configurado na conta).
 *   Enquanto estiver vazio, os botões de compra ficam desativados e exibem "Inscrições em breve".
 *   Formato aceito: https://pay.kiwify.com.br/CODIGO (qualquer outro endereço mantém os botões desativados).
 *   Não preencher com link de teste em produção.
 */
window.STY_CONFIG = {
  CHECKOUT_URL: "",
  INSTAGRAM_URL: "" // opcional: perfil oficial da Simone, após confirmação
};
