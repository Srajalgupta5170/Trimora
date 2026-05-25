import { motion } from 'framer-motion';
import { Clock, User, Sparkles, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

const QueueSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="space-y-3"
  >
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="h-20 bg-slate-800/50 rounded-2xl animate-pulse"
      />
    ))}
  </motion.div>
);

export default function QueuePanel({ queue, currentUser, isLoading }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Live Queue
            </h2>
            <p className="text-sm text-slate-400 mt-1">Loading...</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-900/50 border border-white/5">
            <Clock className="w-4 h-4 text-indigo-400 animate-spin" />
          </div>
        </div>
        <QueueSkeleton />
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-10 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mb-6"
        >
          <Sparkles className="w-10 h-10 text-indigo-400" />
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-2">Queue is Empty</h3>
        <p className="text-center text-slate-400 max-w-xs">
          No customers waiting right now. The queue is ready for the next customer!
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full flex flex-col p-8 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Live Queue
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Currently{' '}
            <span className="font-semibold text-indigo-400">{queue.length}</span>{' '}
            people waiting
          </p>
        </div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="px-4 py-2 rounded-xl bg-slate-900/50 border border-indigo-500/30 flex items-center gap-2 shadow-lg shadow-indigo-500/10"
        >
          <Clock className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-slate-200">
            Est: {queue.length * 15} mins
          </span>
        </motion.div>
      </div>

      {/* Queue List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar"
      >
        {queue.map((person, index) => {
          const isServing = index === 0 && person.status === 'in-progress';
          const isCurrentUser = person.id === currentUser?.id;
          const isWaiting = person.status === 'waiting';

          return (
            <motion.div
              key={person.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={clsx(
                'relative flex items-center gap-4 p-4 rounded-2xl transform transition-all duration-300 cursor-pointer group',
                isServing
                  ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/20 border border-indigo-500/50 shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-900/40 border border-white/5 hover:bg-slate-800/60 hover:border-white/10'
              )}
            >
              {/* Left accent line for current user */}
              {isCurrentUser && (
                <motion.div
                  layoutId="currentUserIndicator"
                  className="absolute top-1/2 -left-1 w-1 h-1/2 -translate-y-1/2 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-r-lg"
                  transition={{ duration: 0.3 }}
                />
              )}

              {/* Position Badge */}
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                className={clsx(
                  'w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl font-bold text-lg shadow-lg transition-all',
                  isServing
                    ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-indigo-500/40 ring-2 ring-indigo-400'
                    : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                )}
              >
                #{person.position}
              </motion.div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <h4
                    className={clsx(
                      'font-semibold text-lg truncate',
                      isCurrentUser ? 'text-indigo-300' : 'text-slate-200',
                      isServing && 'text-white'
                    )}
                  >
                    {person.name}
                    {isCurrentUser && (
                      <span className="ml-2 text-sm text-indigo-400 font-medium">
                        (You)
                      </span>
                    )}
                  </h4>

                  <motion.span
                    whileHover={{ scale: 1.1 }}
                    className={clsx(
                      'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex-shrink-0 transition-all',
                      isServing
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                        : isWaiting
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    )}
                  >
                    {person.status}
                  </motion.span>
                </div>

                {/* Status Message */}
                {isServing && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium text-indigo-300 flex items-center gap-2"
                  >
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-indigo-400"
                    />
                    Currently with Barber
                  </motion.p>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}