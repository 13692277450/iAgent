import { TruckOutlined } from "@ant-design/icons/es/icons/index";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,   // 开启严格模式, 避免使用过期的 React API,否则会调用两次。
  reactCompiler: true,
};

export default nextConfig;
