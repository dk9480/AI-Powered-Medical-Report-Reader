import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'framer-motion';

const Preloader = () => {
  return (
    <motion.div 
      className="flex items-center justify-center min-h-screen w-full bg-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-64 h-64">
        <DotLottieReact
          src="https://lottie.host/acf33468-f054-4afc-91c7-2b56530decfc/0XCPFeWnVS.lottie"
          loop
          autoplay
        />
      </div>
    </motion.div>
  );
};

export default Preloader;

