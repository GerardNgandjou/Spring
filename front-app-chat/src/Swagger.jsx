import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function Swagger() {
  return (
    <SwaggerUI
      url="http://localhost:8081/v3/api-docs"
      docExpansion="list"
      defaultModelsExpandDepth={-1}
    />
  );
}
