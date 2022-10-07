export default function handler(req, res) {
    // Obtener el tokenId de los parámetros de consulta
    const tokenId = req.query.tokenId;
    // Como todas las imágenes se cargan en github, podemos extraer las imágenes de github directamente.
    const image_url =
      "https://github.com/Aprende-Web3/nivel-2/tree/main/NFT-Collection/my-app/public/aw3devs/";
    // La API está enviando metadatos para un AW3 Dev
    // Para que nuestra colección sea compatible con Opensea, debemos seguir algunos estándares de metadatos
    // al enviar de vuelta la respuesta desde la API
    // Puede encontrar más información aquí: https://docs.opensea.io/docs/metadata-standards
    res.status(200).json({
      name: "AW3 Dev #" + tokenId,
      description: "AW3 Dev es una colección NFT para desarrolladores en Crypto",
      image: image_url + tokenId + ".svg",
    });
  }