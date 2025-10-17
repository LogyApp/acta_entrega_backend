# Imagen base oficial de Node.js
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install --production

# Copiar el resto del código fuente
COPY . .

# Establecer variable de entorno por defecto
ENV PORT=8080

# Exponer el puerto que usa Cloud Run
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["npm", "start"]
