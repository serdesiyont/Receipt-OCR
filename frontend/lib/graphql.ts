export const graphqlFetch = async <T>(
  query: string,
  variables?: Record<string, any>
): Promise<T> => {
  const body: { query: string; variables?: Record<string, any> } = { query };
  if (variables) {
    body.variables = variables;
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333"}/graphql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  if (result.errors) {
    console.error("GraphQL errors:", result.errors);
    throw new Error(
      `GraphQL error: ${result.errors.map((e: any) => e.message).join(", ")}`
    );
  }

  return result.data;
};

export const graphqlUpload = async (file: File) => {
  const operations = {
    query: `
      mutation CreateOcr($image: Upload!) {
        createOcr(createOcrInput: { image: $image }) {
          id
          storeName
          purchaseDate
          totalAmount
          imageUrl
          status
        }
      }
    `,
    variables: {
      image: null,
    },
  };

  const map = {
    "0": ["variables.image"],
  };

  const formData = new FormData();
  formData.append("operations", JSON.stringify(operations));
  formData.append("map", JSON.stringify(map));
  formData.append("0", file);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333"}/graphql`,
    {
      method: "POST",
      body: formData,
      headers: {
        "apollo-require-preflight": true,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Upload failed:", errorText);
    throw new Error(`Upload failed with status: ${response.status}`);
  }

  const result = await response.json();
  if (result.errors) {
    console.error("GraphQL errors on upload:", result.errors);
    throw new Error(
      `GraphQL error on upload: ${result.errors
        .map((e: any) => e.message)
        .join(", ")}`
    );
  }

  return result.data.createOcr;
};
