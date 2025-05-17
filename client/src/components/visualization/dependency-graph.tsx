import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface Node {
  id: string;
  name: string;
  group: number;
  radius: number;
  x?: number;
  y?: number;
  children?: Node[];
}

interface Link {
  source: string | Node;
  target: string | Node;
  value: number;
}

interface TreeNode extends d3.HierarchyNode<Node> {
  x: number;
  y: number;
  data: Node;
}

interface TreeLink extends d3.HierarchyLink<Node> {
  source: TreeNode;
  target: TreeNode;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface DependencyGraphProps {
  data: GraphData;
  width: number;
  height: number;
  viewType: "force" | "tree" | "circular";
}

interface ExtendedNode extends Node {
  children: ExtendedNode[];
}

const DependencyGraph: React.FC<DependencyGraphProps> = ({ data, width, height, viewType }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%");

    // Create the visualization groups
    let container: d3.Selection<SVGGElement, unknown, null, undefined>;
    let linkGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
    let nodeGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
    let labelGroup: d3.Selection<SVGGElement, unknown, null, undefined>;

    // Initialize container as svg initially
    container = svg.append("g");
    linkGroup = container.append("g");
    nodeGroup = container.append("g");
    labelGroup = container.append("g");

    // Define color scale
    const colorScale = d3.scaleOrdinal<number, string>()
      .domain([1, 2, 3, 4, 5])
      .range(["#3f51b5", "#5c6bc0", "#7986cb", "#9fa8da", "#c5cae9"]);

    const renderTreeLayout = () => {
      // Find the root node (node with most outgoing connections)
      const getNodeConnections = (nodeId: string) => {
        return data.links.filter(link => link.source === nodeId).length;
      };

      const rootNode = data.nodes
        .slice()
        .sort((a, b) => getNodeConnections(b.id) - getNodeConnections(a.id))[0];

      // Create hierarchical data structure
      const nodeMap = new Map(data.nodes.map(node => [node.id, { ...node, children: [] as ExtendedNode[] }]));
      const usedNodes = new Set<string>();
      
      // Build tree structure starting from root
      const buildTree = (nodeId: string, visited: Set<string>) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        
        const children = data.links
          .filter(link => link.source === nodeId)
          .map(link => link.target as string)
          .filter(targetId => !visited.has(targetId));
          
        children.forEach(childId => {
          const parentNode = nodeMap.get(nodeId) as ExtendedNode;
          const childNode = nodeMap.get(childId) as ExtendedNode;
          if (parentNode && childNode) {
            parentNode.children.push(childNode);
            usedNodes.add(childId);
            buildTree(childId, visited);
          }
        });
      };

      buildTree(rootNode.id, new Set());

      // Add remaining nodes as children of root
      data.nodes.forEach(node => {
        if (!usedNodes.has(node.id) && node.id !== rootNode.id) {
          const rootNodeData = nodeMap.get(rootNode.id) as ExtendedNode;
          const unusedNode = nodeMap.get(node.id) as ExtendedNode;
          if (rootNodeData && unusedNode) {
            rootNodeData.children.push(unusedNode);
          }
        }
      });

      // Create D3 hierarchy
      const rootData = nodeMap.get(rootNode.id) as ExtendedNode;
      const hierarchy = d3.hierarchy<ExtendedNode>(rootData);
      
      // Calculate dimensions based on number of nodes
      const nodeCount = hierarchy.descendants().length;
      const levelWidth = Math.max(width, nodeCount * 80); // Increased spacing
      const levelHeight = Math.max(height, nodeCount * 40); // Increased spacing

      // Create tree layout with adjusted dimensions
      const treeLayout = d3.tree<ExtendedNode>()
        .size([levelHeight - 100, levelWidth - 200]); // More horizontal space

      const treeData = treeLayout(hierarchy);

      // Clear previous content
      svg.selectAll("*").remove();

      // Create a container group for panning
      container = svg.append("g")
        .attr("transform", `translate(50, ${-levelHeight/2 + height/2})`) as d3.Selection<SVGGElement, unknown, null, undefined>;

      // Add zoom behavior
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 3]) // Allow more zoom range
        .on("zoom", (event) => {
          container.attr("transform", event.transform);
        });

      svg.call(zoom);

      // Create groups inside container
      linkGroup = container.append("g");
      nodeGroup = container.append("g");
      labelGroup = container.append("g");

      // Create curved links
      const diagonal = (d: d3.HierarchyPointLink<ExtendedNode>) => {
        return `M${d.source.y},${d.source.x}
                C${(d.source.y + d.target.y) / 2},${d.source.x}
                 ${(d.source.y + d.target.y) / 2},${d.target.x}
                 ${d.target.y},${d.target.x}`;
      };

      // Add links with curves
      linkGroup
        .selectAll("path")
        .data(treeData.links())
        .join("path")
        .attr("d", diagonal)
        .attr("fill", "none")
        .attr("stroke", "#3f51b5")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5);

      // Add nodes
      const nodes = nodeGroup
        .selectAll<SVGCircleElement, d3.HierarchyPointNode<ExtendedNode>>("circle")
        .data(treeData.descendants())
        .join("circle")
        .attr("r", d => d.data.radius || 5)
        .attr("fill", d => colorScale(d.data.group))
        .attr("transform", d => `translate(${d.y},${d.x})`);

      // Add labels
      labelGroup
        .selectAll<SVGTextElement, d3.HierarchyPointNode<ExtendedNode>>("text")
        .data(treeData.descendants())
        .join("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white")
        .attr("font-size", d => Math.min((d.data.radius || 10) / 2, 12))
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .text(d => d.data.name.split('/').pop() || '');

      // Add hover interactions
      nodes
        .on("mouseover", function(event: MouseEvent, d: d3.HierarchyPointNode<ExtendedNode>) {
          const node = d3.select<SVGCircleElement, d3.HierarchyPointNode<ExtendedNode>>(this);
          node.attr("r", d.data.radius * 1.2 || 6)
             .attr("fill", () => {
               const color = d3.color(colorScale(d.data.group));
               return color ? color.brighter().toString() : colorScale(d.data.group);
             });
          
          labelGroup
            .selectAll<SVGTextElement, d3.HierarchyPointNode<ExtendedNode>>("text")
            .filter(textD => textD === d)
            .attr("font-size", Math.min((d.data.radius || 10) / 1.5, 14))
            .attr("font-weight", "bold");
        })
        .on("mouseout", function(event: MouseEvent, d: d3.HierarchyPointNode<ExtendedNode>) {
          const node = d3.select<SVGCircleElement, d3.HierarchyPointNode<ExtendedNode>>(this);
          node.attr("r", d.data.radius || 5)
             .attr("fill", () => colorScale(d.data.group));
          
          labelGroup
            .selectAll<SVGTextElement, d3.HierarchyPointNode<ExtendedNode>>("text")
            .filter(textD => textD === d)
            .attr("font-size", Math.min((d.data.radius || 10) / 2, 12))
            .attr("font-weight", "normal");
        });

      // Add initial transform to fit the content
      const initialScale = Math.min(
        width / (levelWidth + 100),
        height / (levelHeight + 50)
      ) * 0.9; // Slightly smaller to ensure margins
      
      const initialX = (width - levelWidth * initialScale) / 2 + 100;
      const initialY = height / 2;
      
      svg.call(zoom.transform, d3.zoomIdentity
        .translate(initialX, initialY)
        .scale(initialScale));
    };

    const renderForceLayout = () => {
      // Create the simulation
      const simulation = d3.forceSimulation<Node, Link>(data.nodes)
        .force("link", d3.forceLink<Node, Link>()
          .id(d => d.id)
          .links(data.links)
          .distance(100))
        .force("charge", d3.forceManyBody().strength(-100))
        .force("center", d3.forceCenter(width / 2, height / 2));

      // Add links
      const links = linkGroup
      .selectAll("line")
      .data(data.links)
      .enter()
      .append("line")
        .attr("stroke", "#3f51b5")
        .attr("stroke-opacity", 0.4);

      // Add nodes
      const nodes = nodeGroup
      .selectAll("circle")
      .data(data.nodes)
      .enter()
      .append("circle")
      .attr("r", d => d.radius)
        .attr("fill", d => colorScale(d.group))
      .call(d3.drag<SVGCircleElement, Node>()
          .on("start", (event) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
          })
          .on("drag", (event) => {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
          })
          .on("end", (event) => {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
          }));

      // Add labels
      const labels = labelGroup
      .selectAll("text")
      .data(data.nodes)
      .enter()
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white")
      .attr("font-size", d => d.radius / 2)
      .text(d => d.name);

    // Update positions on each tick
      simulation.on("tick", () => {
        links
          .attr("x1", d => (d.source as Node).x!)
          .attr("y1", d => (d.source as Node).y!)
          .attr("x2", d => (d.target as Node).x!)
          .attr("y2", d => (d.target as Node).y!);

        nodes
          .attr("cx", d => d.x = Math.max(d.radius, Math.min(width - d.radius, d.x!)))
          .attr("cy", d => d.y = Math.max(d.radius, Math.min(height - d.radius, d.y!)));

      labels
          .attr("x", d => d.x!)
          .attr("y", d => d.y!);
      });

      return simulation;
    };

    const renderCircularLayout = () => {
      const radius = Math.min(width, height) / 2 - 100;
      
      // Create the layout
      const angle = 2 * Math.PI / data.nodes.length;
      data.nodes.forEach((node, i) => {
        node.x = width/2 + radius * Math.cos(i * angle);
        node.y = height/2 + radius * Math.sin(i * angle);
      });

      // Add links
      linkGroup
        .selectAll("line")
        .data(data.links)
        .enter()
        .append("line")
        .attr("x1", d => (d.source as Node).x!)
        .attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!)
        .attr("y2", d => (d.target as Node).y!)
        .attr("stroke", "#3f51b5")
        .attr("stroke-opacity", 0.4);

      // Add nodes
      nodeGroup
        .selectAll("circle")
        .data(data.nodes)
        .enter()
        .append("circle")
        .attr("r", d => d.radius)
        .attr("fill", d => colorScale(d.group))
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);

      // Add labels
      labelGroup
        .selectAll("text")
        .data(data.nodes)
        .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white")
        .attr("font-size", d => d.radius / 2)
        .attr("x", d => d.x!)
        .attr("y", d => d.y!)
        .text(d => d.name);
    };

    let simulation: d3.Simulation<Node, Link> | undefined;

    // Render based on view type
    switch (viewType) {
      case "force":
        simulation = renderForceLayout();
        break;
      case "tree":
        renderTreeLayout();
        break;
      case "circular":
        renderCircularLayout();
        break;
    }

    return () => {
      if (simulation) simulation.stop();
    };
  }, [data, width, height, viewType]);

  return (
    <svg ref={svgRef} className="w-full h-full" />
  );
};

export default DependencyGraph;
