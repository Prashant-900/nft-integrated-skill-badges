import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface RowProps {
  index: number;
  colorClass: string;
  children?: ReactNode;
  isMiddle?: boolean;
}

const Row = ({ index, colorClass, children, isMiddle = false }: RowProps) => {
  // Alternate slide direction: Left, Right, Left, Right, Left
  const slideFromLeft = index % 2 === 0;
  
  // Initial position (off-screen)
  const initialX = slideFromLeft ? -1000 : 1000;
  
  // Animation variants for entrance
  const entranceVariants = {
    hidden: {
      x: initialX,
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        damping: 20,
        stiffness: 100,
        duration: 0.8,
        delay: index * 0.15, // Stagger effect
      },
    },
  };

  // Floating animation for non-middle rows
  const floatingAnimation = {
    y: [0, -10, 0, 10, 0],
    x: [0, 5, 0, -5, 0],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: 'easeInOut' as const,
      delay: 1 + index * 0.2,
    },
  };

  return (
    <motion.div
      className={`${colorClass} rounded-2xl shadow-2xl flex items-center justify-center ${
        isMiddle ? 'h-32' : 'h-24'
      } mx-4 md:mx-8`}
      variants={entranceVariants}
      initial="hidden"
      animate={isMiddle ? 'visible' : ['visible']}
      {...(!isMiddle && { animate: floatingAnimation })}
    >
      {children}
    </motion.div>
  );
};

export default Row;
