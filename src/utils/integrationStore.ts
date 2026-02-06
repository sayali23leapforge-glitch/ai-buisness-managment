export const getIntegrations = () =>
  JSON.parse(localStorage.getItem("connectedIntegrations") || "[]");

export const addIntegration = (name: string) => {
  const list = getIntegrations();
  if (!list.includes(name)) {
    localStorage.setItem("connectedIntegrations", JSON.stringify([...list, name]));
  }
};

export const removeIntegration = (name: string) => {
  const list = getIntegrations();
  const filtered = list.filter((item: string) => item !== name);
  localStorage.setItem("connectedIntegrations", JSON.stringify(filtered));
};

export const isIntegrationConnected = (name: string) => {
  const list = getIntegrations();
  return list.includes(name);
};
