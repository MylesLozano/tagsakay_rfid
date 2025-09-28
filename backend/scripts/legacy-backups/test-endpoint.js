import http from "http";

// Function to test the endpoint
function testEndpoint() {
  // For testing purposes, you might want to include a mock JWT token
  const mockJwtToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTYzMjUwNjQ0OCwiZXhwIjoxNjMyNTA5NDQ4fQ.QR_Owz8W1sVjhz4IZJqUSjbA7C2WW1FsZsYNHwo";

  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/rfid/scans/unregistered",
    method: "GET",
    headers: {
      Authorization: `Bearer ${mockJwtToken}`,
      "Content-Type": "application/json",
    },
  };

  const req = http.request(options, (res) => {
    console.log("Response status:", res.statusCode);

    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("Response data:", data);
    });
  });

  req.on("error", (error) => {
    console.error("Error testing endpoint:", error);
  });

  req.end();
}

// Run the test
testEndpoint();
