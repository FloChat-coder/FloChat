import { motion } from "framer-motion";

const ScrollReveal = ({ children, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }} // Starts 50px lower
      whileInView={{ opacity: 1, y: 0 }} // Moves up to original position
      viewport={{ once: true, margin: "-50px" }} // Triggers when 50px of it is visible
      transition={{ duration: 0.8, delay: delay, ease: "easeOut" }} // Smooth float
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;