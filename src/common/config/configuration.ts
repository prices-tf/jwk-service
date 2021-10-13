export interface Config {
  port: number;
  dataDir: string;
}

export default (): Config => {
  return {
    port:
      process.env.NODE_ENV === 'production'
        ? 3000
        : parseInt(process.env.PORT, 10),
    dataDir: process.env.DATA_DIR,
  };
};
