import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, QrCode, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';
import Badge from './Badge';

/**
 * Procedural Neobrutalist QR Code component.
 * Generates deterministic 2D matrix pattern based on the check-in token.
 */
function ProceduralQRCode({ token, size = 110 }) {
  // Deterministic hash to seed the pseudo-QR pattern
  const seed = (token || 'CP-TICKET').split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 10007, 7);
  const matrixSize = 13;
  const cells = [];

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Corner alignment markers (traditional QR corners)
      const isTopLeft = r < 4 && c < 4;
      const isTopRight = r < 4 && c >= matrixSize - 4;
      const isBottomLeft = r >= matrixSize - 4 && c < 4;

      if (isTopLeft || isTopRight || isBottomLeft) {
        // Outer box or center dot of alignment squares
        const isBorder = (r === 0 || r === 3 || c === 0 || c === 3) ||
          (r === 0 || r === 3 || c === matrixSize - 4 || c === matrixSize - 1) ||
          (r === matrixSize - 4 || r === matrixSize - 1 || c === 0 || c === 3);
        const isCenter = (r >= 1 && r <= 2 && c >= 1 && c <= 2) ||
          (r >= 1 && r <= 2 && c >= matrixSize - 3 && c <= matrixSize - 2) ||
          (r >= matrixSize - 3 && r <= matrixSize - 2 && c >= 1 && c <= 2);

        if (isBorder || isCenter) cells.push({ r, c, fill: '#000' });
      } else {
        // Procedural pseudo-random data bits based on token seed
        const val = (seed * (r * matrixSize + c + 1) * 9301 + 49297) % 233280;
        if (val % 2 === 0) {
          cells.push({ r, c, fill: '#000' });
        }
      }
    }
  }

  const cellSize = size / matrixSize;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="bg-white p-1 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
      {cells.map((cell, idx) => (
        <rect
          key={idx}
          x={cell.c * cellSize}
          y={cell.r * cellSize}
          width={cellSize}
          height={cellSize}
          fill={cell.fill}
        />
      ))}
    </svg>
  );
}

export default function RSVPTicket({ event, rsvpStatus, ticketNumber, checkInCode, waitlistPosition }) {
  const isWaitlist = rsvpStatus === 'Waitlisted';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`relative w-full overflow-hidden bg-white border-4 border-black p-6 md:p-8 neo-shadow transition-all ${
        isWaitlist ? 'bg-amber-50/40' : 'bg-white'
      }`}
    >
      {/* Top Banner Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b-3 border-black">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-black/60">
              {isWaitlist ? 'Waitlist Registration' : 'Official Admission Pass'}
            </span>
          </div>
          <h2 className="text-black text-2xl md:text-3xl font-display font-black uppercase leading-tight">
            {event?.title || 'Campus Event'}
          </h2>
          <p className="text-black/70 text-xs font-bold uppercase tracking-wider mt-1 flex items-center gap-1.5">
            <MapPin size={14} className="text-black" />
            {event?.location || 'ASIET Campus Venue'}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {isWaitlist ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-pastel-peach border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000]">
              <Clock className="w-4 h-4 text-black" strokeWidth={3} />
              Waitlist Queued
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-pastel-mint border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000]">
              <CheckCircle2 className="w-4 h-4 text-black" strokeWidth={3} />
              Confirmed Seat
            </div>
          )}
        </div>
      </div>

      {/* Ticket Details & Barcode / QR Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Date & Location Columns */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-pastel-yellow/30 border-2 border-black p-3 shadow-[2px_2px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase tracking-wider text-black/60 block mb-0.5">
                Date & Time
              </span>
              <span className="font-display font-black text-sm uppercase text-black block">
                {event?.date}
              </span>
              <span className="text-xs font-bold text-black/80">
                {event?.time || '10:00 AM'}
              </span>
            </div>

            <div className="bg-pastel-mint/30 border-2 border-black p-3 shadow-[2px_2px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase tracking-wider text-black/60 block mb-0.5">
                Department / Club
              </span>
              <span className="font-display font-black text-sm uppercase text-black block truncate">
                {event?.faculty || 'General Campus'}
              </span>
              <span className="text-xs font-bold text-black/80 truncate block">
                {event?.category || 'Student Activity'}
              </span>
            </div>
          </div>

          {/* Ticket ID & Instructions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-black/70">
                {isWaitlist ? 'Queue Identifier' : 'Attendee Ticket ID'}
              </span>
              <span className="font-mono text-xs font-black bg-pastel-yellow px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_#000]">
                {ticketNumber || 'TKT-PENDING'}
              </span>
            </div>

            {isWaitlist ? (
              <div className="p-3 bg-amber-100 border-2 border-black text-black text-xs font-bold shadow-[2px_2px_0px_0px_#000] flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-800 shrink-0 mt-0.5" />
                <span>
                  <strong>WAITLIST ACKNOWLEDGMENT:</strong> This pass does not guarantee event admission. If a confirmed seat is cancelled, you will be automatically promoted and notified.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-pastel-mint/20 border-2 border-black text-black text-xs font-bold shadow-[2px_2px_0px_0px_#000] flex items-start gap-2">
                <ShieldCheck size={16} className="text-green-700 shrink-0 mt-0.5" />
                <span>
                  <strong>OFFICIAL ADMISSION:</strong> Present the digital QR code below or your Ticket ID at the venue door for check-in.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Validation Column */}
        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 border-3 border-black shadow-[3px_3px_0px_0px_#000] text-center">
          <ProceduralQRCode token={checkInCode || ticketNumber || event?.id} size={110} />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-black/70 mt-2 block">
            {isWaitlist ? 'WAITLIST QUEUE' : (checkInCode ? 'CHECK-IN CODE' : 'VALIDATION CODE')}
          </span>
          <span className="font-mono text-[11px] font-black text-black bg-white px-2 py-0.5 border border-black mt-1">
            {checkInCode || ticketNumber?.substring(0, 14) || 'VERIFIED'}
          </span>
        </div>
      </div>

      {/* Decorative Neobrutalist Ticket Perforations */}
      <div className="relative border-t-3 border-dashed border-black/30 my-6">
        <div className="absolute top-1/2 -left-10 w-7 h-7 bg-neobrutalist border-3 border-black border-l-0 rounded-r-full transform -translate-y-1/2"></div>
        <div className="absolute top-1/2 -right-10 w-7 h-7 bg-neobrutalist border-3 border-black border-r-0 rounded-l-full transform -translate-y-1/2"></div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold text-black/60 uppercase tracking-wider">
        <span>Campus Venue Entry System</span>
        <span>ASIET Event Management</span>
      </div>
    </motion.div>
  );
}
