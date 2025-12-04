import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Layout,
  Row,
  Col,
  Dropdown,
  Tooltip,
  Space,
  Typography,
  Modal,
  Table,
} from "antd";
import type { MenuProps } from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  CodeOutlined,
  DownOutlined,
  UndoOutlined,
  RedoOutlined,
  ClearOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import "antd/dist/reset.css";

const { Content, Header } = Layout;
const { Title } = Typography;

const styles = `
body {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  margin: 0;
  padding: 0;
}

.editor-code-block {
  font-family: monospace;
  background: linear-gradient(to right, #232526, #414345);
  color: white;
  padding: 8px;
  border-radius: 4px;
  white-space: pre-wrap;
  margin: 8px 0;
}

.editor-container {
  background: linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%);
  border-radius: 12px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  height: 100%;
}

.editor-toolbar {
  background: linear-gradient(to right, #667eea, #764ba2);
  padding: 12px 15px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.editor-textarea {
  border: none;
  border-radius: 0 0 12px 12px;
  padding: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.markdown-preview {
  background: linear-gradient(135deg, #2b5876 0%, #4e4376 100%);
  color: #f0f0f0;
  border-radius: 12px;
  padding: 16px;
  font-family: 'Consolas', monospace;
  overflow-y: auto;
  height: 100%;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.markdown-preview pre {
  white-space: pre-wrap;
  padding: 8px;
  font-size: 14px;
}

.app-header {
  background: linear-gradient(to right, #8e2de2, #4a00e0);
  padding: 16px;
  text-align: center;
  color: white;
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.toolbar-button {
  background: linear-gradient(to right, #6a11cb, #2575fc);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 5px 10px;
  min-width: 34px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.toolbar-button:hover {
  background: linear-gradient(to right, #8e2de2, #4a00e0);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.toolbar-button:active {
  transform: translateY(1px);
}

.active-format-button {
  background: linear-gradient(to right, #8e2de2, #4a00e0);
  color: white;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.editor-action-buttons {
  display: flex;
  gap: 10px;
}

.editor-action-buttons button:disabled {
  background: linear-gradient(to right, #bdc3c7, #8c9ead);
  color: #eeeeee;
  cursor: not-allowed;
}

.app-layout {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.markdown-reference-modal .ant-modal-content {
  background: linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%);
  border-radius: 12px;
  overflow: hidden;
}

.markdown-reference-modal .ant-modal-header {
  background: linear-gradient(to right, #667eea, #764ba2);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  padding: 16px 24px;
  border-bottom: none;
}

.markdown-reference-modal .ant-modal-title {
  color: white;
  font-weight: bold;
}

.markdown-reference-modal .ant-table-thead > tr > th {
  background: linear-gradient(to right, #6a11cb, #2575fc);
  color: white;
  border-bottom: none;
}

.markdown-reference-modal .ant-table-tbody > tr > td {
  background: rgba(255, 255, 255, 0.7);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.markdown-reference-modal .ant-table-tbody > tr:hover > td {
  background: rgba(255, 255, 255, 0.9);
}
`;

const App: React.FC = () => {
  const [editorState, setEditorState] = useState<string[]>([""]);
  const [currentStateIndex, setCurrentStateIndex] = useState<number>(0);
  const [activeFormats, setActiveFormats] = useState<{
    [key: string]: boolean;
  }>({});
  const [savedSelection, setSavedSelection] = useState<{
    range?: Range;
    selection?: Selection;
  } | null>(null);
  const [isReferenceModalVisible, setIsReferenceModalVisible] =
    useState<boolean>(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Helper function to get all nodes within a selection
  const getSelectedNodes = (range: Range): Node[] => {
    const nodes: Node[] = [];

    if (range.startContainer === range.endContainer) {
      nodes.push(range.startContainer);
      return nodes;
    }

    const container = range.commonAncestorContainer;
    const containerElement =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : (container as Element);

    if (!containerElement) return nodes;

    const allParagraphs = containerElement.querySelectorAll(
      "p, div, h1, h2, h3, h4, h5, h6"
    );

    allParagraphs.forEach((paragraph) => {
      const nodeRange = document.createRange();
      nodeRange.selectNodeContents(paragraph);

      if (range.intersectsNode(paragraph)) {
        nodes.push(paragraph);
      }
    });

    return nodes.length > 0 ? nodes : [container];
  };

  // Consolidated function for text formatting (bold, italic, underline)
  const applyTextFormatting = (formatType: "bold" | "italic" | "underline") => {
    const selectionData = getSelection();
    if (!selectionData) return;

    const { selection, range, selectedText } = selectionData;
    if (!selectedText) return;

    const selectedNodes = getSelectedNodes(range);

    if (selectedNodes.length > 1) {
      formatMultipleNodes(selectedNodes, formatType);
      return;
    }

    let tagName: string;
    switch (formatType) {
      case "bold":
        tagName = "strong";
        break;
      case "italic":
        tagName = "em";
        break;
      case "underline":
        tagName = "u";
        break;
    }

    // Check if the format is already applied
    const formatElement =
      isOrContainsNodeType(range.commonAncestorContainer, tagName) ||
      (formatType === "bold" &&
        isOrContainsNodeType(range.commonAncestorContainer, "b")) ||
      (formatType === "italic" &&
        isOrContainsNodeType(range.commonAncestorContainer, "i"));

    if (formatElement) {
      // Remove formatting
      const textNode = document.createTextNode(formatElement.textContent || "");
      formatElement.parentNode?.replaceChild(textNode, formatElement);

      // Create a new range for the text node
      const newRange = document.createRange();
      newRange.selectNodeContents(textNode);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      // Add formatting
      const newElement = document.createElement(tagName);
      newElement.textContent = selectedText;

      // Replace the selection with our new element
      range.deleteContents();
      range.insertNode(newElement);

      // Re-select the element
      selectElement(newElement);
    }

    // Update state and active formats
    saveCurrentState(true);
    updateActiveFormats();
  };

  // Helper function to format multiple nodes with the same style
  const formatMultipleNodes = (
    nodes: Node[],
    formatType: "bold" | "italic" | "underline"
  ) => {
    nodes.forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const element = node as HTMLElement;
      const content = element.textContent || "";

      if (!content.trim()) return;

      let formattedElement: HTMLElement;
      switch (formatType) {
        case "bold":
          formattedElement = document.createElement("strong");
          break;
        case "italic":
          formattedElement = document.createElement("em");
          break;
        case "underline":
          formattedElement = document.createElement("u");
          break;
      }

      Array.from(element.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const newFormatElement = formattedElement.cloneNode() as HTMLElement;
          newFormatElement.textContent = child.textContent;
          element.replaceChild(newFormatElement, child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const childElement = child as HTMLElement;

          if (
            (formatType === "bold" &&
              (childElement.tagName === "STRONG" ||
                childElement.tagName === "B")) ||
            (formatType === "italic" &&
              (childElement.tagName === "EM" ||
                childElement.tagName === "I")) ||
            (formatType === "underline" && childElement.tagName === "U")
          ) {
          } else {
            const newFormatElement =
              formattedElement.cloneNode() as HTMLElement;
            newFormatElement.textContent = childElement.textContent;
            element.replaceChild(newFormatElement, childElement);
          }
        }
      });
    });

    saveCurrentState(true);
    updateActiveFormats();
  };

  // Save the current state of the editor
  const saveCurrentState = (force = false) => {
    if (!editorRef.current) return;

    const currentHtml = editorRef.current.innerHTML;

    if (force || currentHtml !== editorState[currentStateIndex]) {
      const newEditorState = editorState.slice(0, currentStateIndex + 1);
      setEditorState([...newEditorState, currentHtml]);
      setCurrentStateIndex(newEditorState.length);
      updateActiveFormats();
    }
  };

  // Handle undo
  const handleUndo = () => {
    if (currentStateIndex > 0) {
      const newIndex = currentStateIndex - 1;
      setCurrentStateIndex(newIndex);

      if (editorRef.current) {
        editorRef.current.innerHTML = editorState[newIndex];
      }

      updateActiveFormats();
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (currentStateIndex < editorState.length - 1) {
      const newIndex = currentStateIndex + 1;
      setCurrentStateIndex(newIndex);

      if (editorRef.current) {
        editorRef.current.innerHTML = editorState[newIndex];
      }

      updateActiveFormats();
    }
  };

  // Reset the editor
  const handleReset = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "<p><br></p>";
      saveCurrentState(true);
      setActiveFormats({});
    }
  };

  // Handle editor input
  const handleEditorInput = () => {
    saveCurrentState();
    updateActiveFormats();
  };

  // Helper function to check if a node is contained within a specific element type
  const isOrContainsNodeType = (
    node: Node,
    nodeName: string
  ): HTMLElement | null => {
    let current: Node | null = node;

    while (current && current !== editorRef.current) {
      if (current.nodeName.toLowerCase() === nodeName.toLowerCase()) {
        return current as HTMLElement;
      }
      current = current.parentNode;
    }

    return null;
  };

  const getSelection = () => {
    if (savedSelection && savedSelection.range) {
      return {
        selection: savedSelection.selection,
        range: savedSelection.range,
        selectedText: savedSelection.range.toString(),
        commonAncestor: savedSelection.range.commonAncestorContainer,
      };
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    return {
      selection,
      range,
      selectedText,
      commonAncestor: range.commonAncestorContainer,
    };
  };

  // Save the current selection before interacting with dropdown
  const saveCurrentSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setSavedSelection(null);
      return;
    }

    const range = selection.getRangeAt(0);
    setSavedSelection({ selection, range });
  };

  // Restore the saved selection
  const restoreSelection = () => {
    if (!savedSelection || !savedSelection.selection || !savedSelection.range)
      return;

    const selection = savedSelection.selection;
    selection.removeAllRanges();
    selection.addRange(savedSelection.range);

    if (editorRef.current) {
      editorRef.current.focus();
    }

    setSavedSelection(null);
  };

  // Update active formats based on current selection
  const updateActiveFormats = () => {
    const selectionData = getSelection();
    if (!selectionData) {
      setActiveFormats({});
      return;
    }

    const { range } = selectionData;
    const node = range.commonAncestorContainer;

    setActiveFormats({
      bold: !!(
        isOrContainsNodeType(node, "strong") || isOrContainsNodeType(node, "b")
      ),
      italic: !!(
        isOrContainsNodeType(node, "em") || isOrContainsNodeType(node, "i")
      ),
      underline: !!isOrContainsNodeType(node, "u"),
      h1: !!isOrContainsNodeType(node, "h1"),
      h2: !!isOrContainsNodeType(node, "h2"),
      h3: !!isOrContainsNodeType(node, "h3"),
      h4: !!isOrContainsNodeType(node, "h4"),
      ul: !!isOrContainsNodeType(node, "ul"),
      ol: !!isOrContainsNodeType(node, "ol"),
      code: !!(() => {
        const codeElement = isOrContainsNodeType(node, "div");
        return (
          codeElement &&
          (codeElement.className === "editor-code-block" ||
            codeElement.getAttribute("data-element-type") === "code-block")
        );
      })(),
    });
  };

  // Helper function to restore selection to an element
  const selectElement = (element: HTMLElement) => {
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  // Toggle heading formatting
  const toggleHeading = (level: string) => {
    const selectionData = getSelection();
    if (!selectionData) return;

    const { selection, range, selectedText } = selectionData;
    if (!selectedText) return;

    const selectedNodes = getSelectedNodes(range);

    if (selectedNodes.length > 1) {
      selectedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const element = node as HTMLElement;
        if (!element.textContent?.trim()) return;

        const headingElement = document.createElement(level);
        headingElement.innerHTML = element.innerHTML;

        if (element.parentNode) {
          element.parentNode.replaceChild(headingElement, element);
        }
      });

      saveCurrentState(true);
      updateActiveFormats();
      return;
    }

    const headingElement = isOrContainsNodeType(
      range.commonAncestorContainer,
      level
    );

    if (headingElement) {
      const textNode = document.createTextNode(
        headingElement.textContent || ""
      );

      const paragraphElement = document.createElement("p");
      paragraphElement.appendChild(textNode);
      headingElement.parentNode?.replaceChild(paragraphElement, headingElement);

      const newRange = document.createRange();
      newRange.selectNodeContents(paragraphElement);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      for (const hLevel of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
        const existingHeading = isOrContainsNodeType(
          range.commonAncestorContainer,
          hLevel
        );
        if (existingHeading) {
          const newHeading = document.createElement(level);
          newHeading.textContent = existingHeading.textContent;
          existingHeading.parentNode?.replaceChild(newHeading, existingHeading);
          selectElement(newHeading);
          saveCurrentState(true);
          updateActiveFormats();
          return;
        }
      }

      const headingElement = document.createElement(level);
      headingElement.textContent = selectedText;
      range.deleteContents();
      range.insertNode(headingElement);
      selectElement(headingElement);
      const spaceNode = document.createTextNode("\n");
      headingElement.after(spaceNode);
    }

    saveCurrentState(true);
    updateActiveFormats();
  };

  // Toggle code block formatting with proper multi-line support
  const toggleCodeBlock = () => {
    const selectionData = getSelection();
    if (!selectionData) return;

    const { selection, range, selectedText } = selectionData;
    if (!selectedText) return;

    // Check if we're already in a code block
    const codeElement = isOrContainsNodeType(
      range.commonAncestorContainer,
      "div"
    );
    const isCodeBlock =
      codeElement &&
      (codeElement.className === "editor-code-block" ||
        codeElement.getAttribute("data-element-type") === "code-block");

    if (isCodeBlock) {
      // Remove the code block formatting and convert back to text
      const textNode = document.createTextNode(codeElement.textContent || "");
      codeElement.parentNode?.replaceChild(textNode, codeElement);

      const newRange = document.createRange();
      newRange.selectNodeContents(textNode);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      // Get all selected nodes to handle multi-line selection
      const selectedNodes = getSelectedNodes(range);

      if (selectedNodes.length > 1) {
        // Handle multi-line selection
        const codeBlock = document.createElement("div");
        codeBlock.className = "editor-code-block";
        codeBlock.setAttribute("data-element-type", "code-block");

        // Create a document fragment to store all content
        const fragment = document.createDocumentFragment();

        // Process each selected node
        selectedNodes.forEach((node, index) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          const element = node as HTMLElement;
          if (!element.textContent?.trim() && element.innerHTML !== "<br>")
            return;

          // Add the node's content
          if (index > 0) {
            // Add a line break between nodes
            fragment.appendChild(document.createElement("br"));
          }

          // Clone the node's contents
          const content = element.cloneNode(true);

          // If the content is wrapped in a block element, we just want its inner content
          if (content.nodeType === Node.ELEMENT_NODE) {
            fragment.appendChild(document.createTextNode(element.innerText));
          } else {
            fragment.appendChild(content);
          }

          // Remove the original node if it's not the first one
          if (element.parentNode && index > 0) {
            element.parentNode.removeChild(element);
          }
        });

        // Set the code block content
        codeBlock.appendChild(fragment);

        // Replace the first selected node with our code block
        if (selectedNodes[0].nodeType === Node.ELEMENT_NODE) {
          const firstElement = selectedNodes[0] as HTMLElement;
          if (firstElement.parentNode) {
            firstElement.parentNode.replaceChild(codeBlock, firstElement);
          }
        } else {
          range.deleteContents();
          range.insertNode(codeBlock);
        }

        // Select the code block
        selectElement(codeBlock);
      } else {
        // Single node selection
        const codeBlock = document.createElement("div");
        codeBlock.className = "editor-code-block";
        codeBlock.setAttribute("data-element-type", "code-block");

        // Make sure we preserve newlines in the content
        const content = selectedText.replace(/\n/g, "<br>");
        codeBlock.innerHTML = content;

        range.deleteContents();
        range.insertNode(codeBlock);
        selectElement(codeBlock);
      }
    }

    saveCurrentState(true);
    updateActiveFormats();
  };

  // Toggle list formatting
  const toggleList = (listType: "ul" | "ol") => {
    const selectionData = getSelection();
    if (!selectionData) return;

    const { selection, range, selectedText } = selectionData;
    if (!selectedText) return;

    const selectedNodes = getSelectedNodes(range);

    if (selectedNodes.length > 1) {
      const listElement = document.createElement(listType);

      selectedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const element = node as HTMLElement;
        if (!element.textContent?.trim()) return;

        const li = document.createElement("li");
        li.innerHTML = element.innerHTML;
        listElement.appendChild(li);

        if (element.parentNode) {
          if (node === selectedNodes[0]) {
            element.parentNode.replaceChild(listElement, element);
          } else {
            element.parentNode.removeChild(element);
          }
        }
      });

      selectElement(listElement);
      saveCurrentState(true);
      updateActiveFormats();
      return;
    }

    // Check if already in the same list type
    const currentListElement = isOrContainsNodeType(
      range.commonAncestorContainer,
      listType
    );

    if (currentListElement) {
      // Convert list to paragraphs
      const items = currentListElement.querySelectorAll("li");
      const fragment = document.createDocumentFragment();

      Array.from(items).forEach((item) => {
        const p = document.createElement("p");
        p.innerHTML = item.innerHTML;
        fragment.appendChild(p);
      });

      currentListElement.parentNode?.replaceChild(fragment, currentListElement);

      if (fragment.firstChild) {
        const newRange = document.createRange();
        newRange.selectNodeContents(fragment.firstChild);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    } else {
      // Check if it's the other list type
      const otherListType = listType === "ul" ? "ol" : "ul";
      const otherListElement = isOrContainsNodeType(
        range.commonAncestorContainer,
        otherListType
      );

      if (otherListElement) {
        // Convert between list types
        const newListElement = document.createElement(listType);
        const items = otherListElement.querySelectorAll("li");

        items.forEach((item) => {
          const newItem = document.createElement("li");
          newItem.innerHTML = item.innerHTML;
          newListElement.appendChild(newItem);
        });

        otherListElement.parentNode?.replaceChild(
          newListElement,
          otherListElement
        );

        selectElement(newListElement);
      } else {
        // Create a new list
        const lines = selectedText.split("\n");
        const listElement = document.createElement(listType);

        lines.forEach((line) => {
          if (line.trim()) {
            const li = document.createElement("li");
            li.textContent = line.trim();
            listElement.appendChild(li);
          }
        });

        range.deleteContents();
        range.insertNode(listElement);
        selectElement(listElement);
      }
    }

    saveCurrentState(true);
    updateActiveFormats();
  };

  // Convert HTML to Markdown
  const getMarkdown = (): string => {
    if (!editorRef.current) return "";

    const html = editorRef.current.innerHTML;
    const tempEl = document.createElement("div");
    tempEl.innerHTML = html;

    let markdown = processNodeToMarkdown(tempEl);
    markdown = markdown.replace(/\n{3,}/g, "\n\n");

    return markdown;
  };

  // 3. Update the processNodeToMarkdown function to handle code blocks with pre elements
  const processNodeToMarkdown = (node: Node): string => {
    if (!node) return "";

    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const element = node as HTMLElement;
    // Handle code blocks with proper newline preservation
    if (
      element.className === "editor-code-block" ||
      element.getAttribute("data-element-type") === "code-block"
    ) {
      // Convert <br> tags to newlines
      const content = element.innerHTML
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]*>/g, "");

      return "```\n" + content + "\n```\n\n";
    }

    if (
      element.className === "editor-code-block" ||
      element.getAttribute("data-element-type") === "code-block"
    ) {
      return "```\n" + (element.textContent || "") + "\n```\n\n";
    }

    switch (element.nodeName.toLowerCase()) {
      case "h1":
        return `# ${getTextContent(element)}\n\n`;
      case "h2":
        return `## ${getTextContent(element)}\n\n`;
      case "h3":
        return `### ${getTextContent(element)}\n\n`;
      case "h4":
        return `#### ${getTextContent(element)}\n\n`;
      case "strong":
      case "b":
        return `**${getTextContent(element)}**`;
      case "em":
      case "i":
        return `*${getTextContent(element)}*`;
      case "u":
        return `<u>${getTextContent(element)}</u>`;
      case "ul":
        return (
          Array.from(element.childNodes)
            .map((child) => processNodeToMarkdown(child))
            .join("") + "\n"
        );
      case "ol":
        let index = 0;
        return (
          Array.from(element.childNodes)
            .map((child) => {
              if (child.nodeName.toLowerCase() === "li") {
                index++;
                return `${index}. ${getTextContent(child as HTMLElement)}\n`;
              }
              return processNodeToMarkdown(child);
            })
            .join("") + "\n"
        );
      case "li":
        return `- ${getTextContent(element)}\n`;
      case "pre":
        return element.textContent || "";
      case "code":
        return `\`${getTextContent(element)}\``;
      case "br":
        return "\n";
      case "p":
        return `${getTextContent(element)}\n\n`;
      case "div":
        if (
          element.textContent?.trim() === "" &&
          element.childNodes.length <= 1
        ) {
          return "\n\n";
        }

        if (
          element.childNodes.length === 1 &&
          element.firstChild?.nodeType === Node.TEXT_NODE
        ) {
          return element.textContent + "\n\n";
        }

        const content = Array.from(element.childNodes)
          .map((child) => processNodeToMarkdown(child))
          .join("");

        return content.endsWith("\n\n") ? content : content + "\n\n";
      default:
        return Array.from(element.childNodes)
          .map((child) => processNodeToMarkdown(child))
          .join("");
    }
  };

  // Helper function to get text content from element and its children
  const getTextContent = (element: HTMLElement): string => {
    if (
      element.childNodes.length === 1 &&
      element.firstChild?.nodeType === Node.ELEMENT_NODE &&
      (element.firstChild as HTMLElement).tagName.toLowerCase() === "br"
    ) {
      return "";
    }

    return Array.from(element.childNodes)
      .map((child) => processNodeToMarkdown(child))
      .join("");
  };

  // Handle key events in the editor
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const paragraphElement = isOrContainsNodeType(
        range.commonAncestorContainer,
        "p"
      );

      if (paragraphElement) {
        const newParagraph = document.createElement("p");
        newParagraph.innerHTML = "<br>";

        if (paragraphElement.nextSibling) {
          paragraphElement.parentNode?.insertBefore(
            newParagraph,
            paragraphElement.nextSibling
          );
        } else {
          paragraphElement.parentNode?.appendChild(newParagraph);
        }

        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStart(newParagraph, 0);
        newRange.setEnd(newParagraph, 0);
        selection.addRange(newRange);
      } else {
        document.execCommand("insertParagraph", false);
      }

      saveCurrentState(true);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
    } else if (
      ((e.ctrlKey || e.metaKey) && e.key === "y") ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
    ) {
      e.preventDefault();
      handleRedo();
    }
  };

  // Initialize the editor
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "<p><br></p>";
      saveCurrentState(true);
      editorRef.current.focus();
    }
  }, []);

  // Monitor selection changes to update button styles
  useEffect(() => {
    const handleSelectionChange = () => {
      updateActiveFormats();
    };

    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  // Helper to update button styles based on selection
  const getButtonStyle = (format: string) => {
    return activeFormats[format] ? "active-format-button" : "toolbar-button";
  };

  // Define dropdown menu items for headings with selection preservation
  const headingItems: MenuProps["items"] = [
    {
      key: "h1",
      label: "Heading 1",
      onClick: () => {
        restoreSelection();
        toggleHeading("h1");
      },
    },
    {
      key: "h2",
      label: "Heading 2",
      onClick: () => {
        restoreSelection();
        toggleHeading("h2");
      },
    },
    {
      key: "h3",
      label: "Heading 3",
      onClick: () => {
        restoreSelection();
        toggleHeading("h3");
      },
    },
    {
      key: "h4",
      label: "Heading 4",
      onClick: () => {
        restoreSelection();
        toggleHeading("h4");
      },
    },
  ];

  // Define dropdown menu items for lists with selection preservation
  const listItems: MenuProps["items"] = [
    {
      key: "ul",
      label: "Bullet List",
      icon: <UnorderedListOutlined />,
      onClick: () => {
        restoreSelection();
        toggleList("ul");
      },
    },
    {
      key: "ol",
      label: "Numbered List",
      icon: <OrderedListOutlined />,
      onClick: () => {
        restoreSelection();
        toggleList("ol");
      },
    },
  ];

  // Define dropdown menu items for text formatting with selection preservation
  const textFormatItems: MenuProps["items"] = [
    {
      key: "bold",
      label: "Bold",
      icon: <BoldOutlined />,
      onClick: () => {
        restoreSelection();
        applyTextFormatting("bold");
      },
    },
    {
      key: "italic",
      label: "Italic",
      icon: <ItalicOutlined />,
      onClick: () => {
        restoreSelection();
        applyTextFormatting("italic");
      },
    },
    {
      key: "underline",
      label: "Underline",
      icon: <UnderlineOutlined />,
      onClick: () => {
        restoreSelection();
        applyTextFormatting("underline");
      },
    },
  ];

  // Helper to determine which heading is active
  const getActiveHeadingText = () => {
    if (activeFormats.h1) return "Heading 1";
    if (activeFormats.h2) return "Heading 2";
    if (activeFormats.h3) return "Heading 3";
    if (activeFormats.h4) return "Heading 4";
    return "Heading";
  };

  // Markdown reference data for the modal
  const markdownReferenceData = [
    {
      key: "1",
      markdown: "# Heading 1",
      html: "<h1>Heading 1</h1>",
    },
    {
      key: "2",
      markdown: "## Heading 2",
      html: "<h2>Heading 2</h2>",
    },
    {
      key: "3",
      markdown: "**bold text**",
      html: "<b>bold text</b>",
    },
    {
      key: "4",
      markdown: "*italic text*",
      html: "<i>italic text</i>",
    },
    {
      key: "5",
      markdown: "- Item 1",
      html: "<ul><li>Item 1</li></ul>",
    },
    {
      key: "6",
      markdown: "1. Item 1",
      html: "<ol><li>Item 1</li></ol>",
    },
    {
      key: "7",
      markdown: "```\ncode block\n```",
      html: "<pre><code>code block</code></pre>",
    },
  ];

  const markdownReferenceColumns = [
    {
      title: "Markdown",
      dataIndex: "markdown",
      key: "markdown",
      render: (text: string) => <code>{text}</code>,
    },
    {
      title: "HTML",
      dataIndex: "html",
      key: "html",
      render: (text: string) => <code>{text}</code>,
    },
  ];

  return (
    <Layout className="app-layout">
      <style>{styles}</style>
      <Header className="app-header">
        <Title level={2} style={{ color: "white", margin: 0 }}>
          Markdown
        </Title>
      </Header>
      <Content style={{ padding: "0 20px 20px" }}>
        <Row gutter={20} style={{ height: "calc(100vh - 120px)" }}>
          <Col span={12}>
            <div className="editor-container">
              <div className="editor-toolbar">
                {/* Text Format Dropdown */}
                <Dropdown
                  menu={{ items: textFormatItems }}
                  trigger={["click"]}
                  onOpenChange={(open) => {
                    if (open) {
                      saveCurrentSelection();
                    }
                  }}
                >
                  <Button
                    className={
                      activeFormats.bold ||
                      activeFormats.italic ||
                      activeFormats.underline
                        ? "active-format-button"
                        : "toolbar-button"
                    }
                  >
                    <Space>
                      Format
                      <DownOutlined />
                    </Space>
                  </Button>
                </Dropdown>

                {/* Headings Dropdown */}
                <Dropdown
                  menu={{ items: headingItems }}
                  trigger={["click"]}
                  onOpenChange={(open) => {
                    if (open) {
                      saveCurrentSelection();
                    }
                  }}
                >
                  <Button
                    className={
                      activeFormats.h1 ||
                      activeFormats.h2 ||
                      activeFormats.h3 ||
                      activeFormats.h4
                        ? "active-format-button"
                        : "toolbar-button"
                    }
                  >
                    <Space>
                      {getActiveHeadingText()}
                      <DownOutlined />
                    </Space>
                  </Button>
                </Dropdown>

                {/* Lists Dropdown */}
                <Dropdown
                  menu={{ items: listItems }}
                  trigger={["click"]}
                  onOpenChange={(open) => {
                    if (open) {
                      saveCurrentSelection();
                    }
                  }}
                >
                  <Button
                    className={
                      activeFormats.ul || activeFormats.ol
                        ? "active-format-button"
                        : "toolbar-button"
                    }
                  >
                    <Space>
                      List
                      <DownOutlined />
                    </Space>
                  </Button>
                </Dropdown>

                <Tooltip title="Code Block">
                  <Button
                    icon={<CodeOutlined />}
                    onClick={toggleCodeBlock}
                    className={
                      activeFormats.code
                        ? "active-format-button"
                        : "toolbar-button"
                    }
                  />
                </Tooltip>

                <Tooltip title="Undo">
                  <Button
                    icon={<UndoOutlined />}
                    onClick={handleUndo}
                    disabled={currentStateIndex <= 0}
                    className="toolbar-button"
                  />
                </Tooltip>

                <Tooltip title="Redo">
                  <Button
                    icon={<RedoOutlined />}
                    onClick={handleRedo}
                    disabled={currentStateIndex >= editorState.length - 1}
                    className="toolbar-button"
                  />
                </Tooltip>

                <Tooltip title="Reset">
                  <Button
                    icon={<ClearOutlined />}
                    onClick={handleReset}
                    className="toolbar-button"
                  />
                </Tooltip>
                {/* New Markdown Reference Button */}
                <Tooltip title="Markdown Reference">
                  <Button
                    icon={<QuestionCircleOutlined />}
                    onClick={() => setIsReferenceModalVisible(true)}
                    className="toolbar-button"
                  />
                </Tooltip>
              </div>
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                onKeyDown={handleKeyDown}
                className="editor-textarea"
                style={{ height: "calc(100% - 64px)" }}
              />
            </div>
          </Col>
          <Col span={12}>
            <div className="markdown-preview">
              <pre>
                {getMarkdown() || "Markdown output will appear here..."}
              </pre>
            </div>
          </Col>
        </Row>
      </Content>

      {/* Markdown Reference Modal */}
      <Modal
        title="Markdown Reference Guide"
        open={isReferenceModalVisible}
        onCancel={() => setIsReferenceModalVisible(false)}
        footer={null}
        width={700}
        className="markdown-reference-modal"
      >
        <Table
          dataSource={markdownReferenceData}
          columns={markdownReferenceColumns}
          pagination={false}
          bordered
        />
      </Modal>
    </Layout>
  );
};

export default App;
