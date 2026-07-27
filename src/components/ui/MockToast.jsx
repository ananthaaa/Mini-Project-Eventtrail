import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationContext } from '../../context/NotificationContext';
import { Bell, CheckCircle2, X } from 'lucide-react';

const MockToast = () => {
  const { notifications, removeNotification } = useContext(NotificationContext);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto flex items-start gap-4 p-4 bg-white border-4 border-black shadow-neobrutalist w-80 relative"
          >
            <div className={`mt-1 shrink-0 ${notif.type === 'success' ? 'text-green-500' : 'text-accent-blue'}`}>
              {notif.type === 'success' ? <CheckCircle2 size={24} /> : <Bell size={24} />}
            </div>
            
            <div className="flex-1 pr-6">
              <h4 className="font-black uppercase text-sm mb-1">{notif.type === 'success' ? 'Success' : 'Notification'}</h4>
              <p className="text-sm font-bold text-gray-700 leading-tight">{notif.message}</p>
            </div>

            <button 
              onClick={() => removeNotification(notif.id)}
              className="absolute top-2 right-2 p-1 hover:bg-gray-100 border-2 border-transparent hover:border-black transition-all"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MockToast;
