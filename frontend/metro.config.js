const { getDefaultConfig } = require("expo/metro-config"); 
const config = getDefaultConfig(__dirname); 

// Add additional resolver for React Native 
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];
config.resolver.extraNodeModules = { 
  ...config.resolver.extraNodeModules, 
  'react-native': require.resolve('react-native'), 
};

// Add support for Hermes 
config.transformer.unstable_allowRequireContext = true; 

// Mock react-native-maps sur le web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      type: 'empty',
    };
  }
  
  // Comportement par défaut
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;