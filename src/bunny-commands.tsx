// src/index.tsx
import { ActionPanel, Action, List, showToast, Toast } from "@raycast/api";
import { useState, useEffect } from "react";
import { BunnyCommand } from "../types";
import fs from "fs";
import path from "path";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [filteredCommands, setFilteredCommands] = useState<BunnyCommand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commands, setCommands] = useState<BunnyCommand[]>([]);

  useEffect(() => {
    // Load commands when component mounts
    loadCommands();
  }, []);

  const BASE_URL = "https://www.internalfb.com/intern/bunny/?q=";

  const getSearchUrl = (command: string, fullSearchText: string) => {
    // If the search text is longer than the command, it means there's additional search terms
    if (fullSearchText.length > command.length) {
      // Use the full search text instead of just the command
      return BASE_URL + encodeURIComponent(fullSearchText);
    }
    // Otherwise just use the command
    return BASE_URL + encodeURIComponent(command);
  };

  useEffect(() => {
    // Debounced filter function
    const timeoutId = setTimeout(() => {
      if (commands.length > 0) {
        const searchLower = searchText.toLowerCase();
        const filtered = commands
          .filter((command) =>
            command.name.toLowerCase().startsWith(searchLower) ||
            searchLower.startsWith(command.name.toLowerCase())
          )
          .slice(0, 100); // Limit results to prevent memory issues

        setFilteredCommands(filtered);
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [searchText, commands]);

  const loadCommands = async () => {
    try {
      const filePath = path.join(__dirname, "bunny_commands.json");

      // Read file in chunks
      const fileContent = await fs.promises.readFile(filePath, {
        encoding: "utf-8",
        flag: "r"
      });

      // Parse JSON with a limit on the initial array size
      const commands = JSON.parse(fileContent);

      if (!Array.isArray(commands)) {
        throw new Error("JSON content is not an array");
      }

      // Limit the initial load if the array is very large
      const initialCommands = commands.slice(0, 3000); // Load first 1000 commands initially

      setCommands(initialCommands);
      setFilteredCommands(initialCommands);
      setIsLoading(false);

      showToast({
        style: Toast.Style.Success,
        title: `Loaded ${initialCommands.length} commands`,
      });

    } catch (error) {
      console.error("Error loading commands:", error);
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to load commands",
        message: String(error),
      });
      setIsLoading(false);
    }
  };

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search bunny commands..."
      throttle
    >
      {filteredCommands.map((command) => (
        <List.Item
          key={command.name}
          title={command.name}
          subtitle={command.description}
          actions={
            <ActionPanel>
              <ActionPanel.Section>
                <Action.OpenInBrowser url={getSearchUrl(command.name, searchText)} />
                <Action.CopyToClipboard
                  title="Copy URL"
                  content={getSearchUrl(command.name, searchText)}
                  shortcut={{ modifiers: ["cmd"], key: "." }}
                />
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
