import { useState, useEffect, useRef } from "react";
import {
  ChakraProvider,
  Flex,
  Box,
  Heading,
  Text,
  Button,
  Textarea,
  useColorModeValue,
  Spinner,
} from "@chakra-ui/react";

const parseMarkdown = (text) => {
  const markdownRules = [
    [/^######\s(.*?)\n/gm, "<h6>$1</h6>"],
    [/#####\s(.*?)\n/gm, "<h5>$1</h5>"],
    [/####\s(.*?)\n/gm, "<h4>$1</h4>"],
    [/###\s(.*?)\n/gm, "<h3>$1</h3>"],
    [/##\s(.*?)\n/gm, "<h2>$1</h2>"],
    [/#\s(.*?)\n/gm, "<h1>$1</h1>"],
    [/\*\*(.*?)\*\*/g, "<strong>$1</strong>"],
    [/\*(.*?)\*/g, "<em>$1</em>"],
    [/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>'],
    [/\!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />'],
    [
      /(^\s*[*+-]\s[^\n]+\n)+/gm,
      (match) => {
        const items = match
          .trim()
          .split("\n")
          .map((item) => `<li>${item.replace(/^\s*[*+-]\s/, "")}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      },
    ],
    [/^\>\s?(.*)\n/gm, "<blockquote>$1</blockquote>"],
    [
      /```([\s\S]*?)```/g,
      (match, p1) => `<pre><code>${p1.trim()}</code></pre>`,
    ],
    [/`(.*?)`/g, "<code>$1</code>"],
    [/([^\n]+)\n/g, "<p>$1</p>"],
    [/\n/g, "<br />"],
  ];

  return {
    __html: markdownRules.reduce(
      (parsedText, [rule, replacement]) =>
        parsedText.replace(rule, replacement),
      text
    ),
  };
};

// Chatbot response component
const ChatbotResponse = ({ content }) => (
  <div
    className="prose prose-sm max-w-none text-gray-800 space-y-3"
    dangerouslySetInnerHTML={parseMarkdown(content)}
  />
);

const Chatbot = () => {
  const [userInput, setUserInput] = useState("");
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);

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

  // Fetches response from server with typing indicator
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
      const response = await fetch("https://0fomkl04d9.execute-api.us-east-1.amazonaws.com/gemini-response", {
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

      // Asumsi server mengembalikan JSON
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

  // Clears error on input change
  useEffect(() => {
    if (userInput) {
      setError(null);
    }
  }, [userInput]);

  // Dynamically adjusts textarea height
  useEffect(() => {
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [userInput, chatHistory]);

  // Clears input and chat history
  const clearChat = () => {
    setUserInput("");
    setError(null);
    setChatHistory([]);
  };

  return (
    <ChakraProvider>
      <Flex
        bg="white"
        h="100vh"
        direction="column"
        // fo="true"
        maxW="3xl"
        mx="auto"
      >
        {/* Header */}
        <Box
          flexGrow={1}
          flexDirection="column"
          justifyContent="end"
          px={6}
          py={8}
        >
          <Box textAlign="center" mb={8}>
            <Heading as="h1" size="3xl" fontWeight="bold" color="gray.800">
              Ask Library AI Anything
            </Heading>
            <Text color="gray.600" mt={2}>
              Trusted by Millions of Student & Fortune Bachelor Companies
            </Text>
          </Box>

          {/* Chat history */}
          <Flex
            flexGrow={1}
            overflowY="auto"
            mb={20}
            px={4}
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
          >
            {chatHistory.length === 0 ? (
              <Button
                bg="blue.500"
                color="white"
                px={6}
                py={3}
                borderRadius="lg"
                fontWeight="medium"
                onClick={handleSurprise}
                _hover={{ bg: "blue.600" }}
              >
                Surprise Me
              </Button>
            ) : (
              chatHistory.map((chatItem, index) => (
                <Box
                  key={index}
                  mb={2}
                  p={4}
                  borderRadius="lg"
                  bg={
                    chatItem.role === "user"
                      ? "blue.100"
                      : useColorModeValue("gray.100", "gray.700")
                  }
                  textAlign={chatItem.role === "user" ? "right" : "left"}
                  alignSelf={
                    chatItem.role === "user" ? "flex-end" : "flex-start"
                  }
                >
                  <ChatbotResponse content={chatItem.parts[0].text} />
                </Box>
              ))
            )}

            {/* Typing indicator */}
            {isTyping && (
              <Box
                mb={2}
                p={4}
                borderRadius="lg"
                bg={useColorModeValue("gray.100", "gray.700")}
                textAlign="left"
                alignSelf="flex-start"
              >
                <Spinner size="sm" color="blue.500" />
                <Text ml={2} as="span" fontSize="sm" color="gray.600">
                  Library AI is typing...
                </Text>
              </Box>
            )}
          </Flex>
        </Box>

        {/* Input and buttons */}
        <Box position="fixed" bottom={0} left={0} w="full" px={6}>
          <Box bg="gray.100" borderRadius="lg" p={4} shadow="md" display="flex">
            <Textarea
              ref={textareaRef}
              value={userInput}
              placeholder="Ask me anything..."
              onChange={(e) => setUserInput(e.target.value)}
              flexGrow={1}
              px={4}
              py={2}
              borderRadius="lg"
              bg="gray.200"
              _focus={{ outline: "none" }}
              resize="none"
              overflow="hidden"
              minHeight="36px"
              mr={2}
            />
            <Button
              onClick={getResponse}
              disabled={!userInput.trim() || error !== null}
              bg="blue.500"
              color="white"
              px={6}
              py={2}
              borderRadius="lg"
              fontWeight="medium"
              mr={2}
              _hover={{ bg: "blue.600" }}
            >
              Send
            </Button>
            <Button
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
          </Box>
        </Box>

        {error && (
          <Text color="red.600" mt={2} textAlign="center">
            {error}
          </Text>
        )}
      </Flex>
    </ChakraProvider>
  );
};

export default Chatbot;
