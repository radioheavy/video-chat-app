'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Peer from 'peerjs';
import * as THREE from 'three';

type RoomProps = {
  params: { 
    roomId: string 
  }
};

type UserStream = {
  peerId: string;
  stream: MediaStream;
  isMuted: boolean;
  isVideoOff: boolean;
};

export default function Room({ params }: RoomProps) {
  const router = useRouter();
  const roomId = params.roomId;

  const [peerId, setPeerId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [userStreams, setUserStreams] = useState<UserStream[]>([]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const threeSceneRef = useRef<HTMLDivElement>(null);

  const [localControls, setLocalControls] = useState({
    isMuted: false,
    isVideoOff: false
  });

  // Gelişmiş TURN/STUN Konfigürasyonu
  const peerConfig = {
    host: 'peer.webrtcnexus.com', // Kendi PeerJS sunucunuz
    port: 443,
    path: '/',
    secure: true,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { 
          urls: 'turn:turn.webrtcnexus.com:3478',
          username: 'webrtcuser',
          credential: 'securepassword'
        }
      ]
    }
  };

  // Görüşmeyi sonlandırma fonksiyonu
  const endMeeting = () => {
    localStream?.getTracks().forEach(track => track.stop());
    userStreams.forEach(user => {
      user.stream.getTracks().forEach(track => track.stop());
    });
    peerRef.current?.destroy();
    router.push('/');
  };

  // Bağlantı paylaşım linki oluşturma
  const generateShareLink = () => {
    return `${window.location.origin}/room/${roomId}`;
  };

  // Linki kopyalama
  const copyShareLink = () => {
    const link = generateShareLink();
    navigator.clipboard.writeText(link);
    alert('Oda bağlantısı kopyalandı!');
  };

  // Media ve Peer Kurulumu
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function setupMediaAndPeer() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true, 
          audio: true
        });
        
        currentStream = stream;
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // PeerJS bağlantısı
        const peer = new Peer(undefined, peerConfig);

        peer.on('open', (id) => {
          setPeerId(id);
          console.log('Local Peer ID:', id);
        });

        // Gelen çağrıları yönetme
        peer.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (remoteStream) => {
            setUserStreams(prev => {
              if (prev.some(user => user.peerId === call.peer)) return prev;
              
              return [
                ...prev, 
                { 
                  peerId: call.peer, 
                  stream: remoteStream,
                  isMuted: false,
                  isVideoOff: false 
                }
              ];
            });
          });
        });

        peerRef.current = peer;

      } catch (error) {
        console.error('Media cihazlarına erişim hatası:', error);
      }
    }

    setupMediaAndPeer();

    return () => {
      currentStream?.getTracks().forEach(track => track.stop());
      peerRef.current?.destroy();
    };
  }, []);

  // Kontrol fonksiyonları
  const toggleLocalMute = () => {
    localStream?.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setLocalControls(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const toggleLocalVideo = () => {
    localStream?.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setLocalControls(prev => ({ ...prev, isVideoOff: !prev.isVideoOff }));
  };

  // Video grid için dinamik sınıf
  const getVideoGridClass = () => {
    const totalUsers = userStreams.length + 1;
    if (totalUsers <= 2) return 'grid-cols-2';
    if (totalUsers <= 4) return 'grid-cols-2';
    if (totalUsers <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <div className="relative min-h-screen bg-black/90 overflow-hidden">
      {/* Soft Background */}
      <div 
        ref={threeSceneRef} 
        className="absolute inset-0 z-0 opacity-30"
      />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-white text-3xl font-semibold tracking-tight">
              Meeting Room
            </h1>
            <p className="text-gray-400 mt-1">
              Room ID: {roomId}
            </p>
          </div>

          {/* End Meeting Button - Apple Style */}
          <button 
            onClick={endMeeting}
            className="bg-red-500 text-white px-6 py-2 rounded-full 
            hover:bg-red-600 transition-all duration-300 
            flex items-center space-x-2 
            shadow-lg hover:shadow-xl"
          >
            <span>End Call</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        </div>

        {/* Video Grid - Apple Inspired */}
        <div className={`grid ${getVideoGridClass()} gap-6`}>
          {/* Local Video */}
          <div className="bg-gray-900/50 rounded-2xl p-4 
            border border-white/10 
            shadow-2xl 
            transform transition-all 
            hover:scale-[1.02]">
            <div className="relative rounded-xl overflow-hidden">
              <video 
                ref={localVideoRef} 
                autoPlay 
                muted 
                className={`w-full h-auto rounded-xl 
                  ${localControls.isVideoOff ? 'opacity-50' : ''}`}
              />
              <div className="absolute bottom-3 left-1/2 
                -translate-x-1/2 
                bg-black/50 
                rounded-full 
                px-4 py-2 
                flex space-x-4">
                <button 
                  onClick={toggleLocalMute}
                  className={`rounded-full p-2 
                    ${localControls.isMuted 
                      ? 'bg-red-500/70 text-white' 
                      : 'bg-white/20 text-white'}`}
                >
                  {localControls.isMuted ? 'Unmute' : 'Mute'}
                </button>
                <button 
                  onClick={toggleLocalVideo}
                  className={`rounded-full p-2 
                    ${localControls.isVideoOff 
                      ? 'bg-red-500/70 text-white' 
                      : 'bg-white/20 text-white'}`}
                >
                  {localControls.isVideoOff ? 'Video On' : 'Video Off'}
                </button>
              </div>
            </div>
          </div>

          {/* Remote Videos */}
          {userStreams.map((user) => (
            <div 
              key={user.peerId} 
              className="bg-gray-900/50 rounded-2xl p-4 
                border border-white/10 
                shadow-2xl 
                transform transition-all 
                hover:scale-[1.02]"
            >
              <div className="relative rounded-xl overflow-hidden">
                <video 
                  srcObject={user.stream}
                  autoPlay
                  className={`w-full h-auto rounded-xl 
                    ${user.isVideoOff ? 'opacity-50' : ''}`}
                />
                <div className="absolute bottom-3 left-1/2 
                  -translate-x-1/2 
                  bg-black/50 
                  rounded-full 
                  px-3 py-1 
                  text-white text-sm">
                  {user.peerId}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Oda Paylaşım Bölümü */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white/10 backdrop-blur-xl rounded-full px-6 py-2 flex items-center space-x-4">
          <span className="text-white text-sm">Oda Bağlantısı:</span>
          <button 
            onClick={copyShareLink}
            className="bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition-colors"
          >
            Bağlantıyı Kopyala
          </button>
        </div>
      </div>
    </div>
  );
} 