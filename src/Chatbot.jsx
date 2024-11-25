import { useState, useEffect, useRef } from "react";
import {
  ChakraProvider,
  Box,
  Heading,
  Text,
  Button,
  Textarea,
  Flex,
  Spinner,
  useColorModeValue,
} from "@chakra-ui/react";
import TextareaAutosize from "react-textarea-autosize"; // untuk auto-resizing textarea

// Komponen untuk menampilkan response dari chatbot
const ChatbotResponse = ({ content }) => (
  <Box
    mb={2}
    p={4}
    borderRadius="lg"
    bg={useColorModeValue("gray.100", "gray.700")}
    textAlign="left"
    alignSelf="flex-start"
  >
    <Text dangerouslySetInnerHTML={{ __html: content }} />
  </Box>
);

// Surprise questions
const surpriseOptions = [
  "Kamu ini apa?",
  "Kamu dibuat oleh siapa dan untuk apa?",
  "Pada Model ini, kamu difokuskan untuk apa?",
  "kode ini dibuat untuk apa?",
];

// Selects a random surprise question
const handleSurprise = () => {
  const randomIndex = Math.floor(Math.random() * surpriseOptions.length);
  setUserInput(surpriseOptions[randomIndex]);
};

const Chatbot = () => {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  // Fungsi untuk mengirimkan pesan dan mendapatkan response dari API
  const getResponse = async () => {
    const message = userInput.trim();

    if (!message) {
      setError("Please enter a message.");
      return;
    }

    setError(null);
    setChatHistory((prevHistory) => [
      ...prevHistory,
      { role: "user", parts: [{ text: message }] },
    ]);
    setUserInput("");
    setIsTyping(true);

    try {
      const response = await fetch("http://localhost:4100/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: chatHistory.slice(-5),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Network response error.");
      }

      const data = await response.json();
      const responseText = data.message;

      setChatHistory((prevHistory) => [
        ...prevHistory,
        { role: "model", parts: [{ text: responseText }] },
      ]);
    } catch (error) {
      console.error("Error fetching response:", error);
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsTyping(false);
    }
  };

  // Fungsi untuk membersihkan chat
  const clearChat = () => {
    setUserInput("");
    setError(null);
    setChatHistory([]);
  };

  return (
    <ChakraProvider>
      <Flex
        direction="column"
        minHeight="100vh"
        justify="space-between"
        bg={useColorModeValue("white", "gray.800")}
        p={6}
      >
        {/* Header */}
        <Box textAlign="center" mb={8}>
          <Heading as="h1" size="2xl" fontWeight="bold" color="gray.800">
            AI Assistant Learning Simple
          </Heading>
          <Text color="gray.600" mt={2}>
            Tanyakan apa saja, saya akan menjelaskannya secara simple dan mudah dimengerti
          </Text>
        </Box>

        {/* Chat History */}
        <Box flex="1" overflowY="auto" mb={8}>
          {chatHistory.map((chatItem, index) => (
            <ChatbotResponse key={index} content={chatItem.parts[0].text} />
          ))}
          {/* Typing indicator */}
          {isTyping && (
            <Box
              mb={2}
              p={4}
              borderRadius="lg"
              bg={useColorModeValue("gray.100", "gray.700")}
              textAlign="left"
            >
              <Spinner size="sm" color="blue.500" />
              <Text ml={2} as="span" fontSize="sm" color="gray.600">
                Library AI is typing...
              </Text>
            </Box>
          )}
        </Box>

        {/* Input and Buttons */}
        <Box display="flex" flexDirection="column" alignItems="center">
          <Box width="full" bg="gray.100" p={4} borderRadius="lg" shadow="md">
            <Flex align="center">
              <TextareaAutosize
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                minRows={1}
                maxRows={5}
                placeholder="Ask me anything..."
                style={{
                  width: "100%",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  backgroundColor: "#f7fafc",
                  resize: "none",
                  overflow: "hidden",
                }}
              />
              <Button
                ml={2}
                onClick={getResponse}
                disabled={!userInput.trim() || error !== null}
                bg="blue.500"
                color="white"
                px={6}
                py={2}
                borderRadius="lg"
                fontWeight="medium"
                _hover={{ bg: "blue.600" }}
              >
                Send
              </Button>
              <Button
                ml={2}
                onClick={clearChat}
                bg="gray.400"
                color="white"
                px={6}
                py={2}
                borderRadius="lg"
                fontWeight="medium"
                _hover={{ bg: "gray.500" }}
              >
                Clear
              </Button>
            </Flex>
          </Box>

          {/* Error message */}
          {error && (
            <Text color="red.600" mt={4} textAlign="center">
              {error}
            </Text>
          )}
        </Box>
      </Flex>
    </ChakraProvider>
  );
};

export default Chatbot;
