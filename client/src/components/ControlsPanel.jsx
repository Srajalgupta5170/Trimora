import { motion, AnimatePresence } from 'framer-motion';
import { User, BellRing, HandCoins, ArrowRight, CheckCircle, LogOut, Zap } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';
import { useState } from 'react';

export default function ControlsPanel({ 
  role, 
  currentUser, 
  queue, 
  onJoinQueue, 
  onNextCustomer, 
  onCompleteService,
  isLoading 
}) {
  const [isJoining, setIsJoining] = useState(false);
  const [isCallingNext, setIsCallingNext] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const isBarber = role === 'barber';
  const customerInQueue = queue.find(q => q.id === currentUser?.id);
  const positionInQueue = queue.findIndex(q => q.id === currentUser?.id) + 1;
  const isCurrentlyServing = isBarber && queue.length > 0 && queue[0].status === 'in-progress';
  const currentCustomer = isBarber && queue.length > 0 ? queue[0] : null;

  const handleJoinQueue = async () => {
    setIsJoining(true);
    await onJoinQueue();
    setIsJoining(false);
  };

  const handleNextCustomer = async () => {
    setIsCallingNext(true);
    await onNextCustomer();
    setIsCallingNext(false);
  };

  const handleCompleteService = async () => {
    setIsCompleting(true);
    await onCompleteService();
    setIsCompleting(false);
  };

  // ============== BARBER VIEW ==============
  if (isBarber) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full p-8 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center"
      >
        {/* Icon */}
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20"
        >
          <HandCoins className="w-8 h-8 text-indigo-400" />
        </motion.div>

        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
          Barber Controls
        </h2>
        <p className="text-slate-400 mb-8 text-center max-w-[280px] text-sm">
          Manage your queue, call the next customer, and complete services
        </p>

        {/* Current Service Card */}
        <AnimatePresence mode="wait">
          {isCurrentlyServing && currentCustomer ? (
            <motion.div
              key="serving"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full flex flex-col items-center p-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 rounded-2xl mb-8 border border-indigo-500/30 shadow-lg shadow-indigo-500/10"
            >
              <motion.span
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-3"
              >
                ● Currently Serving
              </motion.span>
              <div className="text-center mb-4">
                <div className="text-4xl font-extrabold text-white mb-2">
                  #{currentCustomer.position}
                </div>
                <div className="text-xl font-semibold text-indigo-300">
                  {currentCustomer.name}
                </div>
              </div>
              <motion.div
                animate={{ width: ['0%', '100%'] }}
                transition={{ duration: 60, repeat: Infinity }}
                className="w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              />
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full flex flex-col items-center p-6 bg-slate-900/30 rounded-2xl mb-8 border border-white/5"
            >
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">
                Status
              </span>
              <span className="text-2xl font-bold text-slate-300">
                {queue.length === 0 ? 'Queue Empty' : 'Ready for Next'}
              </span>
              {queue.length > 0 && (
                <p className="text-sm text-slate-400 mt-2">
                  {queue.length} customer{queue.length !== 1 ? 's' : ''} waiting
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Row */}
        <div className="w-full grid grid-cols-2 gap-3 mb-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-4 bg-slate-900/40 rounded-xl border border-white/5 text-center"
          >
            <p className="text-xs text-slate-400 uppercase mb-1">Queue Length</p>
            <p className="text-2xl font-bold text-indigo-400">{queue.length}</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-4 bg-slate-900/40 rounded-xl border border-white/5 text-center"
          >
            <p className="text-xs text-slate-400 uppercase mb-1">Avg. Wait</p>
            <p className="text-2xl font-bold text-purple-400">
              {queue.length > 1 ? (queue.length - 1) * 15 : 0} min
            </p>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 w-full">
          {!isCurrentlyServing ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNextCustomer}
              disabled={queue.length === 0 || isCallingNext}
              className={twMerge(
                clsx(
                  'w-full flex items-center justify-center py-4 rounded-2xl font-bold text-white tracking-wide transition-all shadow-lg duration-300',
                  queue.length > 0 && !isCallingNext
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-indigo-500/40 hover:shadow-2xl cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                )
              )}
            >
              {isCallingNext ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Zap className="w-5 h-5 mr-2" />
                </motion.div>
              ) : (
                <ArrowRight className="w-5 h-5 mr-2" />
              )}
              {isCallingNext ? 'Calling...' : 'Call Next Customer'}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCompleteService}
              disabled={isCompleting}
              className="w-full flex items-center justify-center py-4 rounded-2xl font-bold text-white tracking-wide transition-all shadow-lg duration-300 bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-emerald-500/40 hover:shadow-2xl"
            >
              {isCompleting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                </motion.div>
              ) : (
                <CheckCircle className="w-5 h-5 mr-2" />
              )}
              {isCompleting ? 'Completing...' : 'Complete Service'}
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  // ============== CUSTOMER VIEW ==============
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl relative"
    >
      {/* Decorative glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent rounded-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Avatar */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 p-1 mb-8 shadow-xl shadow-purple-500/30"
        >
          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
            <User className="w-8 h-8 text-indigo-400" />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!customerInQueue ? (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full text-center"
            >
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400 mb-4">
                Ready for a fresh cut?
              </h2>
              <p className="text-slate-400 text-center mb-10 leading-relaxed">
                Join the live queue from your device. We'll let you know when it's your turn.
              </p>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleJoinQueue}
                disabled={isJoining}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/30 transform transition-all duration-300 ring-1 ring-white/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <BellRing className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <BellRing className="w-5 h-5" />
                )}
                {isJoining ? 'Joining...' : 'Join Queue Now'}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="queued"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full text-center"
            >
              <h2 className="text-2xl font-bold text-slate-300 mb-8">
                Your Queue Status
              </h2>

              {/* Position Card */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-full bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 rounded-2xl p-8 mb-8 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/10"
              >
                <div className="text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-3">
                  Your Position
                </div>
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-4"
                >
                  #{positionInQueue}
                </motion.div>

                {/* Status Message */}
                <AnimatePresence mode="wait">
                  {positionInQueue === 1 && customerInQueue.status === 'in-progress' ? (
                    <motion.div
                      key="serving"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-emerald-400 font-medium flex items-center justify-center gap-2"
                    >
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-emerald-400"
                      />
                      It's your turn! You are being served
                    </motion.div>
                  ) : positionInQueue === 1 ? (
                    <motion.div
                      key="next"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-yellow-400 font-medium flex items-center justify-center gap-2"
                    >
                      <motion.span
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.7, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-yellow-400"
                      />
                      You're up next! Get ready!
                    </motion.div>
                  ) : (
                    <motion.div
                      key="wait"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-slate-400 text-sm"
                    >
                      Estimated wait:{' '}
                      <span className="font-medium text-slate-200">
                        {(positionInQueue - 1) * 15} minutes
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Progress Bar */}
              <div className="w-full mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-400 font-medium">Progress</span>
                  <span className="text-xs text-slate-400 font-medium">
                    {positionInQueue === 1 ? '100%' : `${Math.round((1 / positionInQueue) * 100)}%`}
                  </span>
                </div>
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: positionInQueue === 1 ? '100%' : `${Math.round((1 / positionInQueue) * 100)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                />
              </div>

              {/* Leave Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => alert('Left Queue')}
                className="w-full py-4 bg-slate-800/80 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all duration-300 border border-white/5 active:scale-95 flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Leave Queue
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}