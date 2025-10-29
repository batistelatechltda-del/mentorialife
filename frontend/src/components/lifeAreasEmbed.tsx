"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { API } from "@/services";

const COLORS = {
  COMPLETED: "#00ff88",
  IN_PROGRESS: "#ffaa00",
  NOT_STARTED: "#ff4757",
};

interface SubGoal {
  id: string;
  life_area_id: string;
  title: string;
  is_completed: boolean;
  priority: number;
  progress?: number;
  target?: number;
  status: string;
  type: string;
  color: string;
  note?: string;
  dependsOn?: string;
  created_at: string;
  updated_at: string;
}

interface TreeNode {
  id: string;
  name: string;
  color: string;
  type: string;
  status: string;
  note?: string;
  details?: string;
  progress?: number;
  target?: number;
  dependsOn?: string;
  children: TreeNode[];
  sub_goals?: SubGoal[];
}

interface LifeAreasEmbedProps {
  isFullscreen?: boolean;
}

const LifeAreasEmbed: React.FC<LifeAreasEmbedProps> = ({
  isFullscreen = false,
}) => {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: 800,
    height: 500,
  });
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null);
  const [notesSide, setNotesSide] = useState<"left" | "right">("left");
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [nodesToAnimate, setNodesToAnimate] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [fullscreenMode, setFullscreenMode] = useState(false);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;

    const handleResize = () => {
      if (fullscreenMode) {
        setWindowDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      } else {
        setWindowDimensions({
          width: window.innerWidth - 40,
          height: 500,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [fullscreenMode, isMounted]);

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreenMode) {
        setFullscreenMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenMode, isMounted]);

  const fetchLifeAreas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.getAllLifeArea();
      const result = await response.data;

      if (Array.isArray(result.data)) {
        const rootNode: TreeNode = {
          id: "root",
          name: "Life Areas",
          color: "#00f3ff",
          type: "root",
          status: "active",
          note: "Your complete life overview",
          children: result.data.map((area: any) => ({
            id: area.id,
            name: area.name,
            color: area.color || "#ccc",
            type: "area",
            status: area.status,
            note: area.note,
            children: area.sub_goals?.map((subGoal: any) => ({
              id: subGoal.id,
              name: subGoal.title,
              color: "#8888ff", 
              type: "item", 
              status: subGoal.is_completed ? "completed" : "active", 
              note: subGoal.description || "No notes", 
              progress: subGoal.progress,
              target: subGoal.target,
              dependsOn: subGoal.dependsOn || [], 
              children: [],
            })),
          })),
        };
        setTree(rootNode);
      } else {
        setError(result.error || "Failed to fetch life areas");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    if (isMounted) {
      fetchLifeAreas();
    }
  }, [fetchLifeAreas, isMounted]);

  useEffect(() => {
    if (!tree || !isMounted) return;

    const animationInterval = setInterval(() => {
      const allNodes = getAllNodeIds(tree);
      const nodesToGlow = new Set<string>();
      const numToAnimate = Math.floor(Math.random() * 4) + 2;

      for (let i = 0; i < Math.min(numToAnimate, allNodes.length); i++) {
        const randomIndex = Math.floor(Math.random() * allNodes.length);
        nodesToGlow.add(allNodes[randomIndex]);
      }

      setNodesToAnimate(nodesToGlow);
      setTimeout(() => setNodesToAnimate(new Set()), 1500);
    }, 4000);

    return () => clearInterval(animationInterval);
  }, [tree, isMounted]);

  useEffect(() => {
    if (editingNote && noteInputRef.current && isMounted) {
      noteInputRef.current.focus();
    }
  }, [editingNote, isMounted]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.5, Math.min(2, scale + delta));
      setScale(newScale);
    },
    [scale]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (
        e.target === containerRef.current ||
        e.target === contentRef.current
      ) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      }
    },
    [position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(2, prev + 0.2));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(0.5, prev - 0.2));
  }, []);

  const resetTransform = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const getAllNodeIds = (node: TreeNode): string[] => {
    const ids = [node.id];
    node.children.forEach((child) => {
      ids.push(...getAllNodeIds(child));
    });
    return ids;
  };

  const handleNodeClick = (node: TreeNode) => {
    const nodeNote = node.note || "";
    setNoteText(nodeNote);

    const isOnLeft =
      node.type === "root"
        ? false
        : node.id.startsWith("finance") || node.id.startsWith("health");
    setNotesSide(isOnLeft ? "right" : "left");
    setSelectedNode(node);
    setEditingNote(false);

    if (node.type === "area") {
      setExpandedAreaId((prevId) => (prevId === node.id ? null : node.id));
    } else if (node.type === "root") {
      setExpandedAreaId(null); 
    }

    setNodesToAnimate(new Set([node.id]));
    setTimeout(() => setNodesToAnimate(new Set()), 1000);
  };

  const handleEditNoteClick = () => {
    setEditingNote(true);
  };

  const handleSaveNote = async () => {
    if (!selectedNode) return;

    try {
      if (
        selectedNode.type === "item" ||
        selectedNode.type === "dependent-item"
      ) {
        const response = await fetch(`/api/sub-goals/${selectedNode.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ note: noteText }),
        });

        if (response.ok) {
          setTree((prevTree) => {
            if (!prevTree) return prevTree;
            const updateNodeNote = (node: TreeNode): TreeNode => {
              if (node.id === selectedNode.id) {
                return { ...node, note: noteText };
              }
              return {
                ...node,
                children: node.children.map(updateNodeNote),
              };
            };
            return updateNodeNote(prevTree);
          });
        }
      }
      setEditingNote(false);
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  const handleCancelEdit = () => {
    if (selectedNode) {
      setNoteText(selectedNode.note || "");
    }
    setEditingNote(false);
  };

  
  const isNodeVisible = useCallback(
    (node: TreeNode): boolean => {
      if (!node.dependsOn || !tree) return true;

      const findNodeById = (
        searchId: string,
        searchNode: TreeNode
      ): TreeNode | null => {
        if (searchNode.id === searchId) return searchNode;
        for (const child of searchNode.children) {
          const result = findNodeById(searchId, child);
          if (result) return result;
        }
        return null;
      };

      const dependencyNode = findNodeById(node.dependsOn, tree);
      return dependencyNode?.status === "completed" || false;
    },
    [tree]
  );

  const hexToRgb = (hex: string): string => {
    hex = hex.replace(/^#/, "");
    const bigint = Number.parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
  };

  const renderTree = useCallback(() => {
    if (!tree || !isMounted) return null;

    const treeWidth = windowDimensions.width;
    const treeHeight = windowDimensions.height;

    const rootY = treeHeight - 100;
    const areaY = rootY - 180;
    const itemY = areaY - 140;

    const rootNodeWidth = 140;
    const rootNodeHeight = 60;
    const rootNodeX = treeWidth / 2 - rootNodeWidth / 2;

    const numAreas = tree.children.length;
    const areaWidth = Math.min((treeWidth * 0.85) / numAreas, 200);
    const totalAreasWidth = areaWidth * numAreas;
    const areaStartX = (treeWidth - totalAreasWidth) / 2;

    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <div
          className={`tree-node root-node ${
            nodesToAnimate.has("root") ? "pulse" : ""
          } ${hoveredNode === "root" ? "hovered" : ""}`}
          style={{
            position: "absolute",
            left: rootNodeX,
            top: rootY,
            width: rootNodeWidth,
            height: rootNodeHeight,
            borderRadius: "12px",
            backgroundColor: "rgba(0, 243, 255, 0.12)",
            border: "2px solid rgba(0, 243, 255, 0.8)",
            color: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            boxShadow:
              nodesToAnimate.has("root") || hoveredNode === "root"
                ? "0 0 25px rgba(0, 243, 255, 0.6), 0 0 15px rgba(0, 243, 255, 0.4)"
                : "0 0 15px rgba(0, 243, 255, 0.3)",
            textAlign: "center",
            zIndex: 10,
            fontWeight: "600",
            fontSize: "13px",
            padding: "8px",
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            overflow: "hidden",
          }}
          onClick={() => handleNodeClick(tree)}
          onMouseEnter={() => setHoveredNode("root")}
          onMouseLeave={() => setHoveredNode(null)}
        >
          <span
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}
          >
            {tree.name}
          </span>
        </div>

        {tree.children.map((area, index) => {
          const isExpanded = expandedAreaId === area.id;
          const areaNodeX = areaStartX + index * areaWidth;
          const areaNodeWidth = Math.min(110, areaWidth * 0.75);
          const areaNodeHeight = 45;
          const areaCenterX = areaNodeX + areaNodeWidth / 2;

          const lineStartX = rootNodeX + rootNodeWidth / 2;
          const lineStartY = rootY;
          const lineEndX = areaCenterX;
          const lineEndY = areaY + areaNodeHeight;

          return (
            <React.Fragment key={area.id}>
              <svg
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              >
                <line
                  x1={lineStartX}
                  y1={lineStartY}
                  x2={lineEndX}
                  y2={lineEndY}
                  stroke={
                    nodesToAnimate.has(area.id) || hoveredNode === area.id
                      ? `rgba(${hexToRgb(area.color)}, 0.7)`
                      : "rgba(255, 255, 255, 0.25)"
                  }
                  strokeWidth={
                    nodesToAnimate.has(area.id) || hoveredNode === area.id
                      ? "2.5"
                      : "1.5"
                  }
                  strokeDasharray={area.id === "finance" ? "4,4" : undefined}
                />
              </svg>

              <div
                className={`tree-node area-node ${
                  nodesToAnimate.has(area.id) ? "pulse" : ""
                } ${hoveredNode === area.id ? "hovered" : ""}`}
                style={{
                  position: "absolute",
                  left: areaNodeX,
                  top: areaY,
                  width: areaNodeWidth,
                  height: areaNodeHeight,
                  borderRadius: "10px",
                  backgroundColor: `rgba(${hexToRgb(area.color)}, 0.12)`,
                  border: `2px solid ${area.color}`,
                  color: "white",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  boxShadow:
                    nodesToAnimate.has(area.id) || hoveredNode === area.id
                      ? `0 0 20px ${area.color}66, 0 0 10px ${area.color}44`
                      : `0 0 8px ${area.color}66`,
                  textAlign: "center",
                  zIndex: 10,
                  fontWeight: "500",
                  fontSize: "11px",
                  padding: "6px",
                  transition:
                    "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  overflow: "hidden",
                }}
                onClick={() => handleNodeClick(area)}
                onMouseEnter={() => setHoveredNode(area.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "100%",
                    lineHeight: "1.2",
                  }}
                >
                  {area.name.length > 12
                    ? area.name.substring(0, 12) + "..."
                    : area.name}
                </span>
              </div>

              {isExpanded &&
                area.children
                  .filter(
                    (item) =>
                      item.type !== "dependent-item" || isNodeVisible(item)
                  )
                  .map((item, itemIndex) => {
                    const visibleItems = area.children.filter(
                      (item) =>
                        item.type !== "dependent-item" || isNodeVisible(item)
                    );
                    const totalItems = visibleItems.length;
                    const itemWidth = Math.min(areaNodeWidth * 1.1, 120);
                    const itemHeight = 55;
                    const itemSpacing = itemWidth + 15;
                    const totalItemsWidth = totalItems * itemSpacing - 15;
                    const itemStartX = areaCenterX - totalItemsWidth / 2;
                    const itemX = itemStartX + itemIndex * itemSpacing;
                    const itemCenterX = itemX + itemWidth / 2;

                    const statusColor =
                      item.status === "completed"
                        ? COLORS.COMPLETED
                        : item.status === "in-progress"
                        ? COLORS.IN_PROGRESS
                        : COLORS.NOT_STARTED;

                    return (
                      <React.Fragment key={item.id}>
                        <svg
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            pointerEvents: "none",
                            zIndex: 1,
                          }}
                        >
                          <line
                            x1={areaCenterX}
                            y1={areaY}
                            x2={itemCenterX}
                            y2={itemY + itemHeight}
                            stroke={
                              nodesToAnimate.has(item.id) ||
                              hoveredNode === item.id
                                ? `rgba(${hexToRgb(statusColor)}, 0.7)`
                                : "rgba(255, 255, 255, 0.25)"
                            }
                            strokeWidth={
                              nodesToAnimate.has(item.id) ||
                              hoveredNode === item.id
                                ? "2.5"
                                : "1.5"
                            }
                            strokeDasharray={
                              item.type === "dependent-item" ? "4,4" : undefined
                            }
                          />
                        </svg>

                        <div
                          className={`tree-node item-node ${
                            nodesToAnimate.has(item.id) ? "pulse" : ""
                          } ${hoveredNode === item.id ? "hovered" : ""}`}
                          style={{
                            position: "absolute",
                            left: itemX,
                            top: itemY,
                            width: itemWidth,
                            height: itemHeight,
                            borderRadius: "8px",
                            backgroundColor: `rgba(${hexToRgb(
                              statusColor
                            )}, 0.12)`,
                            border: `2px solid ${statusColor}`,
                            color: "white",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            cursor: "pointer",
                            boxShadow:
                              nodesToAnimate.has(item.id) ||
                              hoveredNode === item.id
                                ? `0 0 18px ${statusColor}66, 0 0 8px ${statusColor}44`
                                : `0 0 6px ${statusColor}66`,
                            textAlign: "center",
                            zIndex: 10,
                            padding: "6px",
                            fontSize: "10px",
                            fontWeight: "500",
                            transition:
                              "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                            overflow: "hidden",
                          }}
                          onClick={() => handleNodeClick(item)}
                          onMouseEnter={() => setHoveredNode(item.id)}
                          onMouseLeave={() => setHoveredNode(null)}
                        >
                          <div
                            style={{
                              marginBottom: "0", 
                              lineHeight: "1.2",
                              maxWidth: "100%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.name.length > 15
                              ? item.name.substring(0, 15) + "..."
                              : item.name}
                          </div>

                          {item.dependsOn && (
                            <div
                              style={{
                                position: "absolute",
                                top: -6,
                                right: -6,
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                backgroundColor: "#FFAB00",
                                border: "2px solid #222",
                                zIndex: 11,
                                fontSize: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#000",
                                fontWeight: "bold",
                              }}
                            >
                              !
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
            </React.Fragment>
          );
        })}

        {selectedNode && (
          <div
            className="notes-panel"
            style={{
              position: "absolute",
              top: fullscreenMode ? "10%" : 15,
              [notesSide === "left" ? "left" : "right"]: fullscreenMode
                ? "3%"
                : 15,
              background: "rgba(15, 15, 25, 0.95)",
              borderRadius: "12px",
              padding: "16px",
              width: fullscreenMode ? "320px" : "280px",
              maxHeight: fullscreenMode ? "70%" : "400px",
              border: `1px solid ${selectedNode.color}66`,
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px ${selectedNode.color}33`,
              zIndex: 2000,
              backdropFilter: "blur(12px)",
              animation: "fadeIn 0.3s ease-out",
              transition: "all 0.3s ease",
              transform: scale < 1 ? `scale(${1 / scale})` : "scale(1)",
              transformOrigin: notesSide === "left" ? "top left" : "top right",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                paddingBottom: "8px",
                borderBottom: `1px solid ${selectedNode.color}33`,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: selectedNode.color,
                  fontSize: "14px",
                  fontWeight: "600",
                  textShadow: `0 0 8px ${selectedNode.color}44`,
                  maxWidth: "220px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedNode.name}
              </h3>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#999",
                  cursor: "pointer",
                  fontSize: "16px",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "4px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#999";
                }}
              >
                ×
              </button>
            </div>

            <div
              className="notes-content"
              style={{
                margin: "12px 0",
                fontSize: "12px",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.04)",
                borderRadius: "6px",
                minHeight: "80px",
                maxHeight: "200px",
                overflow: "auto",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              {editingNote ? (
                <textarea
                  ref={noteInputRef}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: "100px",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    color: "white",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "4px",
                    padding: "8px",
                    resize: "vertical",
                    fontFamily: "inherit",
                    fontSize: "12px",
                    lineHeight: "1.4",
                    outline: "none",
                  }}
                  placeholder="Add your notes here..."
                />
              ) : (
                <p
                  style={{
                    margin: 0,
                    lineHeight: "1.5",
                    color: noteText ? "#fff" : "#888",
                    wordWrap: "break-word",
                  }}
                >
                  {noteText || "No notes yet. Click 'Edit' to add some."}
                </p>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "12px",
              }}
            >
              {editingNote ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      background: "rgba(255, 60, 60, 0.15)",
                      border: "1px solid rgba(255, 60, 60, 0.3)",
                      color: "#ff6b6b",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: "500",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255, 60, 60, 0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255, 60, 60, 0.15)";
                    }}
                  >
                    Cancel
                  </button>
                 
                </>
              ) : (
                <></>
         
              )}
            </div>

            {selectedNode.id === "finance-car-sell" && !editingNote && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "8px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  fontSize: "11px",
                  backgroundColor: "rgba(255, 200, 100, 0.08)",
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 200, 100, 0.2)",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "rgba(255, 200, 100, 0.9)",
                    lineHeight: "1.4",
                  }}
                >
                  <span style={{ fontWeight: "600" }}>⚠ Dependent task:</span>
                  <br />
                  This step can only proceed once "Fix My Car" is completed.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }, [
    tree,
    windowDimensions,
    selectedNode,
    expandedAreaId,
    nodesToAnimate,
    hoveredNode,
    notesSide,
    editingNote,
    noteText,
    isNodeVisible,
    scale,
    fullscreenMode,
    isMounted,
  ]);

  useEffect(() => {
    if (!isMounted || typeof document === "undefined") return;

    const embedStarsContainer = document.getElementById(
      "embed-stars-container"
    );
    if (!embedStarsContainer) return;

    embedStarsContainer.innerHTML = "";

    for (let i = 0; i < 50; i++) {
      const star = document.createElement("div");
      const size = Math.random() * 1.5 + 0.3;
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      const duration = 3 + Math.random() * 10;
      const delay = Math.random() * 10;

      star.className = "embed-star";
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${posX}%`;
      star.style.top = `${posY}%`;
      star.style.animationDuration = `${duration}s`;
      star.style.animationDelay = `${delay}s`;
      embedStarsContainer.appendChild(star);
    }

    for (let i = 0; i < 8; i++) {
      const star = document.createElement("div");
      const size = Math.random() * 2 + 1;
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      const duration = 5 + Math.random() * 15;
      const delay = Math.random() * 10;

      star.className = "embed-bright-star";
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${posX}%`;
      star.style.top = `${posY}%`;
      star.style.animationDuration = `${duration}s`;
      star.style.animationDelay = `${delay}s`;
      embedStarsContainer.appendChild(star);
    }

    for (let i = 0; i < 2; i++) {
      const nebula = document.createElement("div");
      const size = 20 + Math.random() * 30;
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      const duration = 20 + Math.random() * 40;
      const delay = Math.random() * 15;
      const hue = Math.floor(Math.random() * 60) + 200;

      nebula.className = "embed-nebula";
      nebula.style.width = `${size}px`;
      nebula.style.height = `${size}px`;
      nebula.style.left = `${posX}%`;
      nebula.style.top = `${posY}%`;
      nebula.style.background = `radial-gradient(circle, hsla(${hue}, 100%, 70%, 0.1) 0%, transparent 70%)`;
      nebula.style.animationDuration = `${duration}s`;
      nebula.style.animationDelay = `${delay}s`;
      embedStarsContainer.appendChild(nebula);
    }
  }, [isMounted]);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-white">Loading...</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-white">Loading life areas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={fetchLifeAreas}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isFullscreen) {
    return renderTree();
  }

  return (
    <div
      ref={containerRef}
      className="life-tree-map-container"
      style={{
        position: "relative",
        width: "100%",
        height: "500px",
        overflow: "hidden",
        border: "1px solid rgba(0, 243, 255, 0.15)",
        borderRadius: "12px",
        boxShadow:
          "0 4px 20px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 243, 255, 0.05)",
        background:
          "linear-gradient(135deg, rgba(15, 15, 30, 0.95) 0%, rgba(25, 25, 50, 0.9) 100%)",
        transition: "all 0.3s ease-in-out",
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div id="embed-stars-container" className="embed-stars-background"></div>
      <style jsx>{`
        :global(.tree-node) {
          --neon-blue: #00f3ff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 8px rgba(0, 243, 255, 0.3);
          }
          50% {
            transform: scale(1.03);
            box-shadow: 0 0 20px rgba(0, 243, 255, 0.5),
              0 0 8px rgba(0, 243, 255, 0.3);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 8px rgba(0, 243, 255, 0.3);
          }
        }

        :global(.pulse) {
          animation: pulse 1s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        :global(.hovered) {
          transform: translateY(-2px) scale(1.02);
        }

        :global(.embed-stars-background) {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        :global(.embed-star) {
          position: absolute;
          background-color: rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          filter: blur(0.5px);
          animation: starTwinkle ease-in-out infinite;
        }

        :global(.embed-bright-star) {
          position: absolute;
          background-color: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          filter: blur(0.3px);
          box-shadow: 0 0 3px rgba(255, 255, 255, 0.5),
            0 0 6px rgba(100, 200, 255, 0.3);
          animation: brightStarTwinkle ease-in-out infinite;
        }

        :global(.embed-nebula) {
          position: absolute;
          border-radius: 50%;
          filter: blur(12px);
          opacity: 0.2;
          animation: nebulaGlow ease-in-out infinite;
        }

        @keyframes starTwinkle {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        @keyframes brightStarTwinkle {
          0%,
          100% {
            opacity: 0.6;
            transform: scale(1);
            box-shadow: 0 0 3px rgba(255, 255, 255, 0.5),
              0 0 6px rgba(100, 200, 255, 0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
            box-shadow: 0 0 6px rgba(255, 255, 255, 0.7),
              0 0 12px rgba(100, 200, 255, 0.5);
          }
        }

        @keyframes nebulaGlow {
          0%,
          100% {
            opacity: 0.15;
            transform: scale(1);
          }
          50% {
            opacity: 0.25;
            transform: scale(1.05);
          }
        }

        /* Custom scrollbar for notes */
        :global(.notes-content::-webkit-scrollbar) {
          width: 4px;
        }

        :global(.notes-content::-webkit-scrollbar-track) {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }

        :global(.notes-content::-webkit-scrollbar-thumb) {
          background: rgba(0, 243, 255, 0.3);
          border-radius: 2px;
        }

        :global(.notes-content::-webkit-scrollbar-thumb:hover) {
          background: rgba(0, 243, 255, 0.5);
        }
      `}</style>

      <div
        ref={contentRef}
        style={{
          width: "100%",
          height: "100%",
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.2s ease-out",
        }}
      >
        {renderTree()}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "50px",
          right: "15px",
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          opacity: 0.4,
          transition: "opacity 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.4";
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            color: "white",
            border: "1px solid rgba(0, 243, 255, 0.3)",
            borderRadius: "50%",
            width: "25px",
            height: "25px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontSize: "12px",
            userSelect: "none",
          }}
          onClick={zoomIn}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0, 243, 255, 0.2)";
            e.currentTarget.style.boxShadow = "0 0 10px rgba(0, 243, 255, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          +
        </div>
        <div
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            color: "white",
            border: "1px solid rgba(0, 243, 255, 0.3)",
            borderRadius: "50%",
            width: "25px",
            height: "25px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontSize: "12px",
            userSelect: "none",
          }}
          onClick={zoomOut}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0, 243, 255, 0.2)";
            e.currentTarget.style.boxShadow = "0 0 10px rgba(0, 243, 255, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          −
        </div>
        <div
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            color: "white",
            border: "1px solid rgba(0, 243, 255, 0.3)",
            borderRadius: "50%",
            width: "25px",
            height: "25px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontSize: "12px",
            userSelect: "none",
          }}
          onClick={resetTransform}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0, 243, 255, 0.2)";
            e.currentTarget.style.boxShadow = "0 0 10px rgba(0, 243, 255, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          ⟲
        </div>
      </div>
    </div>
  );
};

export default LifeAreasEmbed;
