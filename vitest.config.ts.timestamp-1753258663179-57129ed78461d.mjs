// vitest.config.ts
import { defineConfig } from "file:///D:/GitHub/Limni/node_modules/vitest/dist/config.js";
import { svelte } from "file:///D:/GitHub/Limni/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import { sveltePreprocess } from "file:///D:/GitHub/Limni/node_modules/svelte-preprocess/dist/index.js";
import path from "path";
var vitest_config_default = defineConfig({
  plugins: [
    svelte({
      hot: !process.env.VITEST,
      compilerOptions: {
        css: "injected"
      },
      preprocess: sveltePreprocess({
        typescript: true,
        scss: true
      })
    })
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/lib/test-setup.ts"],
    include: ["src/**/*.{test,spec}.{js,ts}"],
    // Добавляем настройки для исправления Svelte preprocessing
    alias: {
      "$lib": path.resolve("./src/lib"),
      "$app": path.resolve("./node_modules/@sveltejs/kit/src/runtime/app"),
      "~": path.resolve("./src")
    },
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/lib/test-setup.ts",
        "**/*.d.ts",
        "**/*.config.*",
        "src-tauri/**"
      ]
    }
  },
  resolve: {
    alias: {
      "$lib": path.resolve("./src/lib"),
      "$app": path.resolve("./node_modules/@sveltejs/kit/src/runtime/app"),
      "~": path.resolve("./src")
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXEdpdEh1YlxcXFxMaW1uaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcR2l0SHViXFxcXExpbW5pXFxcXHZpdGVzdC5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L0dpdEh1Yi9MaW1uaS92aXRlc3QuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZyc7XG5pbXBvcnQgeyBzdmVsdGUgfSBmcm9tICdAc3ZlbHRlanMvdml0ZS1wbHVnaW4tc3ZlbHRlJztcbmltcG9ydCB7IHN2ZWx0ZVByZXByb2Nlc3MgfSBmcm9tICdzdmVsdGUtcHJlcHJvY2Vzcyc7IC8vIFx1MDQxOFx1MDQ0MVx1MDQzRlx1MDQzRVx1MDQzQlx1MDQ0Q1x1MDQzN1x1MDQ0M1x1MDQzNVx1MDQzQyBzdmVsdGUtcHJlcHJvY2Vzc1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICBzdmVsdGUoe1xuICAgICAgaG90OiAhcHJvY2Vzcy5lbnYuVklURVNULFxuICAgICAgY29tcGlsZXJPcHRpb25zOiB7XG4gICAgICAgIGNzczogJ2luamVjdGVkJ1xuICAgICAgfSxcbiAgICAgIHByZXByb2Nlc3M6IHN2ZWx0ZVByZXByb2Nlc3Moe1xuICAgICAgICB0eXBlc2NyaXB0OiB0cnVlLFxuICAgICAgICBzY3NzOiB0cnVlLFxuICAgICAgfSksXG4gICAgfSlcbiAgXSxcbiAgdGVzdDoge1xuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgc2V0dXBGaWxlczogWycuL3NyYy9saWIvdGVzdC1zZXR1cC50cyddLFxuICAgIGluY2x1ZGU6IFsnc3JjLyoqLyoue3Rlc3Qsc3BlY30ue2pzLHRzfSddLFxuICAgIC8vIFx1MDQxNFx1MDQzRVx1MDQzMVx1MDQzMFx1MDQzMlx1MDQzQlx1MDQ0Rlx1MDQzNVx1MDQzQyBcdTA0M0RcdTA0MzBcdTA0NDFcdTA0NDJcdTA0NDBcdTA0M0VcdTA0MzlcdTA0M0FcdTA0MzggXHUwNDM0XHUwNDNCXHUwNDRGIFx1MDQzOFx1MDQ0MVx1MDQzRlx1MDQ0MFx1MDQzMFx1MDQzMlx1MDQzQlx1MDQzNVx1MDQzRFx1MDQzOFx1MDQ0RiBTdmVsdGUgcHJlcHJvY2Vzc2luZ1xuICAgIGFsaWFzOiB7XG4gICAgICAnJGxpYic6IHBhdGgucmVzb2x2ZSgnLi9zcmMvbGliJyksXG4gICAgICAnJGFwcCc6IHBhdGgucmVzb2x2ZSgnLi9ub2RlX21vZHVsZXMvQHN2ZWx0ZWpzL2tpdC9zcmMvcnVudGltZS9hcHAnKSxcbiAgICAgICd+JzogcGF0aC5yZXNvbHZlKCcuL3NyYycpXG4gICAgfSxcbiAgICBjb3ZlcmFnZToge1xuICAgICAgcmVwb3J0ZXI6IFsndGV4dCcsICdqc29uJywgJ2h0bWwnXSxcbiAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgJ25vZGVfbW9kdWxlcy8nLFxuICAgICAgICAnc3JjL2xpYi90ZXN0LXNldHVwLnRzJyxcbiAgICAgICAgJyoqLyouZC50cycsXG4gICAgICAgICcqKi8qLmNvbmZpZy4qJyxcbiAgICAgICAgJ3NyYy10YXVyaS8qKidcbiAgICAgIF1cbiAgICB9XG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJyRsaWInOiBwYXRoLnJlc29sdmUoJy4vc3JjL2xpYicpLFxuICAgICAgJyRhcHAnOiBwYXRoLnJlc29sdmUoJy4vbm9kZV9tb2R1bGVzL0BzdmVsdGVqcy9raXQvc3JjL3J1bnRpbWUvYXBwJyksXG4gICAgICAnfic6IHBhdGgucmVzb2x2ZSgnLi9zcmMnKVxuICAgIH1cbiAgfVxufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TyxTQUFTLG9CQUFvQjtBQUN0USxTQUFTLGNBQWM7QUFDdkIsU0FBUyx3QkFBd0I7QUFDakMsT0FBTyxVQUFVO0FBRWpCLElBQU8sd0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssQ0FBQyxRQUFRLElBQUk7QUFBQSxNQUNsQixpQkFBaUI7QUFBQSxRQUNmLEtBQUs7QUFBQSxNQUNQO0FBQUEsTUFDQSxZQUFZLGlCQUFpQjtBQUFBLFFBQzNCLFlBQVk7QUFBQSxRQUNaLE1BQU07QUFBQSxNQUNSLENBQUM7QUFBQSxJQUNILENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxNQUFNO0FBQUEsSUFDSixhQUFhO0FBQUEsSUFDYixTQUFTO0FBQUEsSUFDVCxZQUFZLENBQUMseUJBQXlCO0FBQUEsSUFDdEMsU0FBUyxDQUFDLDhCQUE4QjtBQUFBO0FBQUEsSUFFeEMsT0FBTztBQUFBLE1BQ0wsUUFBUSxLQUFLLFFBQVEsV0FBVztBQUFBLE1BQ2hDLFFBQVEsS0FBSyxRQUFRLDhDQUE4QztBQUFBLE1BQ25FLEtBQUssS0FBSyxRQUFRLE9BQU87QUFBQSxJQUMzQjtBQUFBLElBQ0EsVUFBVTtBQUFBLE1BQ1IsVUFBVSxDQUFDLFFBQVEsUUFBUSxNQUFNO0FBQUEsTUFDakMsU0FBUztBQUFBLFFBQ1A7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxRQUFRLEtBQUssUUFBUSxXQUFXO0FBQUEsTUFDaEMsUUFBUSxLQUFLLFFBQVEsOENBQThDO0FBQUEsTUFDbkUsS0FBSyxLQUFLLFFBQVEsT0FBTztBQUFBLElBQzNCO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
