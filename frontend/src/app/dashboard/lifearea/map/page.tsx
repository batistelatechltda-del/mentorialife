"use client";

import type React from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { API } from "@/services";
import { useUser } from "@/store/user/userState";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <span className="ml-2 text-white">Loading graph...</span>
    </div>
  ),
});

interface SubGoal {
  id: string;
  life_area_id: string;
  title: string;
  is_completed: boolean;
  priority: number;
  progress?: number;
  target?: number;
  status?: string;
  type?: string;
  color?: string;
  note?: string;
  dependsOn?: string;
  created_at: string;
  updated_at: string;
}

interface LifeArea {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  type?: string;
  status?: string;
  note?: string;
  created_at: string;
  updated_at: string;
  sub_goals: SubGoal[];
}

interface NodeData {
  id: string;
  name: string;
  type: "center" | "area" | "goal";
  progress?: number;
  target?: number;
  status?: string;
  val: number;
  color: string;
  level: number;
  date?: string;
  details?: string;
}

interface LinkData {
  source: string;
  target: string;
  color?: string;
  strength?: number;
  distance?: number;
}

interface GraphData {
  nodes: NodeData[];
  links: LinkData[];
}

const COLORS = {
  CENTER: "#00F3FF",
  HEALTH: "#00c6ff",
  CAREER: "#bb4dff",
  FINANCE: "#00d68f",
  RELATIONSHIPS: "#ff4da5",
  SPIRITUALITY: "#ffcd4d",
  REMINDER: "#ff6b4d",
  JOURNAL: "#4dffff",
  COMPLETED: "#4CAF50",
  IN_PROGRESS: "#FFC107",
  NOT_STARTED: "#757575",
  LINK: "rgba(255, 255, 255, 0.2)",
  HIGHLIGHT_LINK: "rgba(0, 243, 255, 0.6)",
  LINK_AREA: "rgba(255, 255, 255, 0.3)",
  BACKGROUND: "#0A0025",
};

const page: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [windowDimensions, setWindowDimensions] = useState({
    width: 800,
    height: 600,
  });
  const { user }: any = useUser();
  const [userName, setUserName] = useState(user?.profile?.full_name || "Yours");
  const [areaExpanded, setAreaExpanded] = useState<Record<string, boolean>>({
    health: true,
    career: true,
    finance: true,
    relationships: true,
    spirituality: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const graphRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;

    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMounted]);

  const fetchAndGenerateGraphData = useCallback(async () => {
    if (!isMounted) return;

    setLoading(true);
    setError(null);

    const nodes: NodeData[] = [];
    const links: LinkData[] = [];

    nodes.push({
      id: "center",
      name: `${user?.profile?.full_name}'s Life`,
      type: "center",
      val: 20,
      color: COLORS.CENTER,
      level: 0,
    });

    try {
      const response = await API.getAllLifeArea();
      const result = await response.data;

      if (Array.isArray(result.data)) {
        const lifeAreas: LifeArea[] = result.data;

        lifeAreas.forEach((area) => {
          nodes.push({
            id: area.id,
            name: area.name,
            type: "area",
            val: 15,
            color: area.color || COLORS.LINK_AREA,
            level: 1,
          });

          links.push({
            source: "center",
            target: area.id,
            color: COLORS.LINK_AREA,
            strength: 0.3,
            distance: 100,
          });

          if (areaExpanded[area.id]) {
            area.sub_goals.forEach((subGoal) => {
              let status = "not-started";
              if (subGoal.is_completed) {
                status = "completed";
              } else if (
                subGoal.progress !== undefined &&
                subGoal.target !== undefined &&
                subGoal.progress > 0
              ) {
                status = "in-progress";
              }

              const goalColor =
                status === "completed"
                  ? COLORS.COMPLETED
                  : status === "in-progress"
                  ? COLORS.IN_PROGRESS
                  : COLORS.NOT_STARTED;

              const nodeId = `goal-${subGoal.id}`;
              nodes.push({
                id: nodeId,
                name: subGoal.title,
                type: "goal",
                progress: subGoal.progress,
                target: subGoal.target,
                status,
                val: 10,
                color: goalColor,
                level: 2,
                details: `${subGoal.is_completed ? "✓" : "•"} ${
                  subGoal.title
                } ${
                  subGoal.progress !== undefined && subGoal.target !== undefined
                    ? `(${subGoal.progress}/${subGoal.target})`
                    : ""
                }`,
              });

              links.push({
                source: area.id,
                target: nodeId,
                color: COLORS.LINK,
                strength: 0.2,
                distance: 70,
              });
            });
          }
        });
        setGraphData({ nodes, links });
      } else {
        setError(result.error || "Failed to fetch life areas");
      }
    } catch (err) {
      setError("Network error occurred while fetching data.");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [isMounted, areaExpanded]);

  useEffect(() => {
    fetchAndGenerateGraphData();
  }, [fetchAndGenerateGraphData]);

  const toggleAreaExpansion = (areaId: string) => {
    setAreaExpanded((prev) => ({
      ...prev,
      [areaId]: !prev[areaId],
    }));
  };

  const handleNodeClick = useCallback(
    (node: any) => {
      setSelectedNode(node);
      if (node.type === "area") {
        toggleAreaExpansion(node.id);
      }
      if (graphRef.current) {
        const neighbors = getNodeNeighbors(node.id);
        const highlightedNodes = new Set([node.id, ...neighbors.nodeIds]);
        const highlightedLinks = new Set(neighbors.linkIds);
        setHighlightNodes(highlightedNodes);
        setHighlightLinks(highlightedLinks);
        graphRef.current.centerAt(node.x, node.y, 1000);
        graphRef.current.zoom(2, 1000);
      }
    },
    [graphData]
  );

  const getNodeNeighbors = (nodeId: string) => {
    const nodeIds: string[] = [];
    const linkIds: string[] = [];
    graphData.links.forEach((link, index) => {
      if (link.source === nodeId || link.target === nodeId) {
        nodeIds.push(link.source === nodeId ? link.target : link.source);
        linkIds.push(index.toString());
      }
    });
    return { nodeIds, linkIds };
  };

  const closeNodeDetails = () => {
    setSelectedNode(null);
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
  };

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const { id, x, y, val, name, color, type } = node;
      const size = val / globalScale;
      const fontSize = 12 / globalScale;
      const isHighlighted = highlightNodes.has(id);

      ctx.beginPath();
      if (type === "center") {
        ctx.fillStyle = "rgba(0, 243, 255, 0.2)";
        ctx.arc(x, y, size * 1.2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = isHighlighted ? 3 / globalScale : 2 / globalScale;
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (type === "area") {
        ctx.fillStyle = `rgba(${hexToRgb(color)}, 0.2)`;
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = isHighlighted ? 3 / globalScale : 1.5 / globalScale;
        ctx.stroke();
        if (isHighlighted) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      } else {
        if (type === "goal") {
          const width = size * 1.8;
          const height = size;
          const radius = size / 4;
          ctx.fillStyle = `rgba(${hexToRgb(color)}, ${
            isHighlighted ? 0.3 : 0.15
          })`;
          roundRect(ctx, x - width / 2, y - height / 2, width, height, radius);
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = isHighlighted ? 2 / globalScale : 1 / globalScale;
          roundRect(ctx, x - width / 2, y - height / 2, width, height, radius);
          ctx.stroke();
          const progress = node.progress || 0;
          const target = node.target || 1;
          if (target > 0) {
            const percentage = Math.min(progress / target, 1);
            const barWidth = width * 0.8;
            const barHeight = 2 / globalScale;
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.fillRect(
              x - barWidth / 2,
              y + height / 2 - barHeight * 2,
              barWidth,
              barHeight
            );
            ctx.fillStyle = color;
            ctx.fillRect(
              x - barWidth / 2,
              y + height / 2 - barHeight * 2,
              barWidth * percentage,
              barHeight
            );
          }
        }
      }
      const label = name.length > 20 ? `${name.substring(0, 18)}...` : name;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "white";
      ctx.font = `${fontSize}px Arial`;
      const textWidth = ctx.measureText(label).width;
      const textHeight = fontSize;
      if (type !== "center" && type !== "area") {
        ctx.fillStyle = "rgba(10, 0, 37, 0.7)";
        ctx.fillRect(
          x - textWidth / 2 - 2,
          y - textHeight / 2 - 2,
          textWidth + 4,
          textHeight + 4
        );
      }
      ctx.fillStyle =
        isHighlighted || type === "center" || type === "area"
          ? "#ffffff"
          : "#cccccc";
      ctx.fillText(label, x, y);

      if (node.status) {
        const statusY = y + size + 5 / globalScale;
        const statusSize = 3 / globalScale;
        ctx.fillStyle =
          node.status === "completed"
            ? COLORS.COMPLETED
            : node.status === "in-progress"
            ? COLORS.IN_PROGRESS
            : COLORS.NOT_STARTED;
        ctx.beginPath();
        ctx.arc(x, statusY, statusSize, 0, 2 * Math.PI);
        ctx.fill();
      }
    },
    [highlightNodes]
  );

  const linkCanvasObject = useCallback(
    (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const start = link.source;
      const end = link.target;
      if (
        !start ||
        !end ||
        typeof start === "string" ||
        typeof end === "string"
      )
        return;

      const linkIndex = graphData.links.findIndex(
        (l) => l.source === link.source.id && l.target === link.target.id
      );
      const isHighlighted = highlightLinks.has(linkIndex.toString());
      const lineWidth = isHighlighted ? 2 / globalScale : 1 / globalScale;

      ctx.beginPath();
      const sourceType = graphData.nodes.find(
        (n) => n.id === link.source.id
      )?.type;
      const targetType = graphData.nodes.find(
        (n) => n.id === link.target.id
      )?.type;

      const linkColor =
        link.color || (isHighlighted ? COLORS.HIGHLIGHT_LINK : COLORS.LINK);

      if (sourceType === "center" || sourceType === "area") {
        ctx.strokeStyle = linkColor;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
        ctx.strokeStyle = linkColor;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.quadraticCurveTo(
          (start.x + end.x) / 2 + 20,
          (start.y + end.y) / 2 + 20,
          end.x,
          end.y
        );
        ctx.stroke();
      }

      if (isHighlighted) {
        ctx.shadowColor = linkColor;
        ctx.shadowBlur = 5;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    },
    [graphData, highlightLinks]
  );

  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0025]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-white">Loading life areas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0025] text-center text-red-500">
        <p className="mb-4">{error}</p>
        <button
          onClick={fetchAndGenerateGraphData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div
      className="life-areas-container"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: COLORS.BACKGROUND,
        color: "white",
        overflow: "hidden",
      }}
    >
      <div id="stars" className="stars"></div>

      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Link
          href={"/dashboard"}
          style={{
            background: "rgba(0, 0, 0, 0.5)",
            border: "1px solid #00F3FF",
            color: "#00F3FF",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            marginRight: "15px",
            fontSize: "14px",
            boxShadow: "0 0 10px rgba(0, 243, 255, 0.3)",
            textDecoration: "none",
          }}
        >
          Back to Dashboard
        </Link>
        <h1 style={{ color: "#00F3FF", margin: 0 }}>Life Areas Map</h1>
      </div>

      {selectedNode && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            background: "rgba(0, 0, 0, 0.7)",
            borderRadius: "8px",
            padding: "15px",
            maxWidth: "300px",
            border: `1px solid ${selectedNode.color}`,
            boxShadow: `0 0 15px ${selectedNode.color}88`,
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", color: selectedNode.color }}>
              {selectedNode.name}
            </h3>
            <button
              onClick={closeNodeDetails}
              style={{
                background: "transparent",
                border: "none",
                color: "#999",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              ×
            </button>
          </div>
          <div style={{ margin: "10px 0" }}>
            {selectedNode.type === "area" && (
              <p>
                {areaExpanded[selectedNode.id]
                  ? "Click again to collapse this life area."
                  : "Click again to expand and see related items."}
              </p>
            )}
            {selectedNode.type === "goal" &&
              selectedNode.progress !== undefined && (
                <div>
                  <div
                    style={{
                      height: "8px",
                      borderRadius: "4px",
                      background: "rgba(255, 255, 255, 0.1)",
                      marginBottom: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        background:
                          selectedNode.status === "completed"
                            ? COLORS.COMPLETED
                            : COLORS.CENTER,
                        width: `${Math.min(
                          (selectedNode.progress / (selectedNode.target || 1)) *
                            100,
                          100
                        )}%`,
                        height: "100%",
                      }}
                    ></div>
                  </div>
                  <p style={{ fontSize: "14px", margin: "5px 0" }}>
                    {selectedNode.details}
                  </p>
                </div>
              )}
            {selectedNode.type === "center" && (
              <p style={{ fontSize: "14px", margin: "5px 0" }}>
                This is the center of your life map. Explore the connected areas
                to see a visual representation of your goals, reminders, and
                journal entries.
              </p>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "rgba(0, 0, 0, 0.7)",
          borderRadius: "8px",
          padding: "15px",
          zIndex: 10,
        }}
      >
        <h4 style={{ margin: "0 0 10px 0", color: "#00F3FF" }}>Legend</h4>
        <ul style={{ padding: "0 0 0 20px", margin: 0 }}>
          {[
            { name: "Health", color: COLORS.HEALTH },
            { name: "Career", color: COLORS.CAREER },
            { name: "Finance", color: COLORS.FINANCE },
            { name: "Relationships", color: COLORS.RELATIONSHIPS },
            { name: "Spirituality", color: COLORS.SPIRITUALITY },
          ].map((item) => (
            <li
              key={item.name}
              style={{
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: item.color,
                  marginRight: "8px",
                }}
              ></div>
              <span>{item.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ width: "100%", height: "100%" }}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeCanvasObject={nodeCanvasObject}
          linkCanvasObject={linkCanvasObject}
          width={windowDimensions.width}
          height={windowDimensions.height}
          nodeRelSize={8}
          nodeId="id"
          linkSource="source"
          linkTarget="target"
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          cooldownTicks={100}
          onNodeClick={handleNodeClick}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          linkDirectionalParticles={1}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleWidth={1.5}
          onBackgroundClick={closeNodeDetails}
          backgroundColor="rgba(0,0,0,0)"
          warmupTicks={50}
        />
      </div>
    </div>
  );
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function hexToRgb(hex: string): string {
  hex = hex.replace(/^#/, "");
  const bigint = Number.parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

export default page;
