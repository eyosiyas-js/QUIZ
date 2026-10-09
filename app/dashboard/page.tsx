'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { IconRefresh, IconTrophy } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import Countdown from 'react-countdown';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useSiteConfig } from '@/context/site-config-context';

const participantsData = [
  {
    id: 1,
    name: 'Alice Johnson',
    score: 1200,
    prizesWon: ['Gift Card', 'T-Shirt'],
    lastActive: '2025-05-08T10:30:00Z'
  },
  {
    id: 2,
    name: 'Bob Smith',
    score: 950,
    prizesWon: ['Headphones'],
    lastActive: '2025-05-07T14:20:00Z'
  },
  {
    id: 3,
    name: 'Charlie Brown',
    score: 1800,
    prizesWon: ['Tesla Model S'],
    lastActive: '2025-05-06T09:15:00Z'
  },
  {
    id: 4,
    name: 'Diana Lee',
    score: 600,
    prizesWon: [],
    lastActive: '2025-05-05T16:45:00Z'
  },
  {
    id: 5,
    name: 'Evan Davis',
    score: 1400,
    prizesWon: ['Gift Card'],
    lastActive: '2025-05-04T11:00:00Z'
  }
];

const ParticipantCountCard = ({ token, config }: any) => {
  const [eligibleParticipants, setEligibleParticipants] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const eligibleCount = eligibleParticipants?.length || 0;
  const totalContestants = participantsData.length;

  useEffect(() => {
    if (!token) return;

    const fetchEligibleParticipants = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get(`/dashboard/eligible_count`);
        setEligibleParticipants(response.data || '');
      } catch (err) {
        setError(err.message || 'Failed to load eligible participants');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEligibleParticipants();
  }, [token]);

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <Card className='h-full bg-white/10 backdrop-blur-md border-white/20 shadow-md'>
        <CardHeader>
          <CardTitle className='text-lg'>{config?.pages?.dashboard?.eligibleTitle || 'Eligible Participants'}</CardTitle>
        </CardHeader>
        <CardContent className='text-foreground mx-auto flex h-5 items-center justify-center py-2 text-3xl mb-2 font-bold'>
          {isLoading ? (
            <div className='bg-muted h-8 w-12 animate-pulse rounded-lg'></div>
          ) : error ? (
            <span className='text-destructive'>{error}</span>
          ) : (
            eligibleParticipants?.eligible_users_count
          )}
        </CardContent>
      </Card>
      <Card className='h-full bg-white/10 backdrop-blur-md border-white/20 shadow-md'>
        <CardHeader>
          <CardTitle className='text-lg'>{config?.pages?.dashboard?.totalTitle || 'Total Contestants'}</CardTitle>
        </CardHeader>
        <CardContent className='text-foreground mx-auto flex h-5 items-center justify-center py-2 mb-2 text-3xl font-bold'>
          {eligibleParticipants?.outof}
        </CardContent>
      </Card>
    </div>
  );
};

const CountdownCard = ({ quizSessions, config }: any) => {
  const [endTime, setEndTime] = useState<number | null>(null);
  const router = useRouter()

  useEffect(() => {
    if (quizSessions && quizSessions.length > 0) {
      const latestSession = quizSessions.reduce((prev, current) =>
        current.sessionNumber > prev.sessionNumber ? current : prev
      );

      const sessionStart = new Date(latestSession.timestamp).getTime();
      const sessionEnd = sessionStart + 1 * 60 * 60 * 1000;

      setEndTime(sessionEnd);
    }
  }, [quizSessions]);

  const renderer = ({ hours, minutes, seconds, completed }) => {
    if (completed) {
      return <span className="text-destructive">Time's Up!</span>;
    } else {
      return (
        <span className="text-4xl mt-24 font-bold">
          {hours}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
      );
    }
  };

  const handleComplete = () => {
    router.push('/minilottery')
    // You can also trigger additional side effects here
  };

  if (!endTime) return null;

  return (
    <Card className="h-full flex flex-col bg-white/10 backdrop-blur-md border-white/20 overflow-hidden shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">{config?.pages?.dashboard?.countdownTitle || 'Time Remaining For The Next Award'}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow text-foreground flex items-center justify-center text-center text-3xl font-bold">
        <Countdown date={endTime} renderer={renderer} onComplete={handleComplete} />
      </CardContent>
    </Card>
  );
};



const MiniPrizesCard = ({ token }) => {
  const [miniPrizes, setMiniPrizes] = useState([]);
  const [grandPrizes, setGrandPrizes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const prizes = [...(miniPrizes || []), ...(grandPrizes || [])].filter(Boolean);

  useEffect(() => {
    if (!token) return;

    const fetchPrizes = async () => {
      setIsLoading(true);
      try {
        const [miniRes, grandRes] = await Promise.all([
          api.get(`/dashboard/rewards/mini`),
          api.get(`/dashboard/rewards/grand`)
        ]);
        setMiniPrizes(miniRes.data || []);
        setGrandPrizes(grandRes.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load prizes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrizes();
  }, [token]);

  return (
    <Card className='h-full bg-white/10 backdrop-blur-md border-white/20 flex-1 shadow-md'>
      {isLoading ? (
        <CardContent className='flex h-64 justify-center py-1'>
          <div className='bg-muted h-full w-full animate-pulse rounded-lg'></div>
        </CardContent>
      ) : error ? (
        <CardContent className='py-1'>
          <p className='text-destructive text-center'>{error}</p>
        </CardContent>
      ) : prizes.length === 0 ? (
        <CardContent className='py-1'>
          <p className='text-muted-foreground text-center'>No prizes available</p>
        </CardContent>
      ) : (
        <Carousel plugins={[Autoplay({ delay: 3000 })]} className='w-full'>
          <CarouselContent>
            {prizes.map((prize, index) => (
              <CarouselItem key={index} className='md:basis-1/1'>
                <CardHeader>
                  <CardTitle className='text-lg'>{prize?.name}</CardTitle>
                </CardHeader>
                <CardContent className='py-1'>
                  <div className='flex flex-col items-center'>
                    <div className='relative mb-4 h-32 w-32'>
                      <Image
                        src={prize?.image_url}
                        alt={prize?.name}
                        fill
                        className='rounded-lg object-cover shadow-md'
                      />
                    </div>
                    <p className='text-muted-foreground text-center text-sm'>
                      {prize.name}
                    </p>
                  </div>
                </CardContent>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}
    </Card>
  );
};

const WinnersCard = ({ quizSessions }) => {
  const chunk = (array, size) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };
  const chunkedSessions = chunk(quizSessions, 3);

  return (
    <Card className='h-full bg-white/10 backdrop-blur-md border-white/20 flex-1 shadow-md'>
      {quizSessions.length === 0 ? (
        <CardContent className='py-1'>
          <p className='text-muted-foreground text-center'>No Winners</p>
        </CardContent>
      ) : (
        <Carousel plugins={[Autoplay({ delay: 3000 })]} className='w-full'>
          <CarouselContent>
            {chunkedSessions.map((group, slideIndex) => (
              <CarouselItem key={slideIndex} className='md:basis-1/1'>
                <div className='flex justify-center gap-4'>
                  {group.map((prize, index) => (
                    <Card key={index} className='bg-white/10 my-4 backdrop-blur-md border-white/20 shadow-md w-full max-w-xs'>
                      <CardContent className='py-1'>
                        <div className='flex flex-col items-center'>
                          <p className='text-white text-center mb-2 text-md'>
                            Game {prize?.sessionNumber} Winner
                          </p>
                          <div className='relative mb-4 h-32 w-32'>
                            <Image
                              src={"https://shandaarbuy.pk/cdn/shop/files/Redmi_Watch_4_Xiaomi_Global_Smart_Watch.jpg?v=1724945719"}
                              alt={"prize"}
                              fill
                              className='rounded-lg object-cover shadow-md'
                            />
                          </div>
                          <p className='text-white text-center text-md'>
                            {prize?.winners[0]?.name}
                          </p>
                          <p className='text-gray text-center text-sm'>
                            {prize?.winners[0]?.phone}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}
    </Card>
  );
};

export default function ParticipantsDashboardPage() {
  const [quizSessions, setQuizSessions] = useState([]);
  const [token, setToken] = useState(null);
  const { config } = useSiteConfig();

  const theme = config?.theme;
  const media = config?.media;
  const sections = config?.sections;
  const branding = config?.branding;
  const dashConfig = config?.pages?.dashboard;
  const gradientFrom = theme?.primaryGradientFrom || '#0b1236';
  const gradientVia = theme?.primaryGradientVia || '#0f1a4a';
  const gradientTo = theme?.primaryGradientTo || '#091029';

  useEffect(() => {
    setToken(localStorage.getItem('auth_token'));
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchWinners = async () => {
      try {
        const response = await api.get(`/dashboard/winners/mini`);

        const groupedSessions = response.data.reduce((acc, winner) => {
          const drawId = winner.draw_id;
          if (!acc[drawId]) {
            acc[drawId] = {
              sessionNumber: drawId,
              timestamp: winner.draw_time,
              winners: []
            };
          }
          acc[drawId].winners.push({ name: winner.winner_name, phone: winner.phone_number });
          return acc;
        }, {});

        const sessionsArray = Object.values(groupedSessions).sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        setQuizSessions(sessionsArray);
      } catch (error) {
        console.error('Failed to fetch winners', error);
      }
    };

    fetchWinners();
  }, [token]);

  return (
    <div className="bg-no-repeat bg-cover bg-center flex min-h-screen flex-col items-center justify-center p-4 relative" style={{ background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientVia}, ${gradientTo})` }}>
      <div className="absolute inset-0 bg-no-repeat bg-cover bg-center blur-sm scale-105 z-0" style={{ backgroundImage: media?.backgroundImageUrl ? `url(${media.backgroundImageUrl})` : 'url(/ETX.jpg)' }} />
      <div className="absolute inset-0 z-10" style={{ background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientVia}, ${gradientTo})`, opacity: theme?.overlayOpacity ?? 0.6 }} />

      <div className="w-full max-w-6xl relative z-20">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6 overflow-hidden p-6 relative ">
        {sections?.showQrCode !== false && (
        <div className='hidden sm:flex items-center justify-around'>
          <div className='flex flex-col items-center'>
  {sections?.showLogo !== false && branding?.logoUrl && (
  <img
           src={branding.logoUrl}
           alt={branding?.organizationName || 'Logo'}
          className='rounded-lg h-[120px] shadow-md'
  />
  )}
  <h1 className='text-[40px] font-bold'>{dashConfig?.heroTitle || 'Scan the QR to win Prizes'}</h1>
          </div>
          
  <img
    src={media?.qrCodeUrl || '/qr.png'}
    alt={'QR Code'}
    className='rounded-lg h-[300px] shadow-md'
  />
</div>
        )}


          <h1 className='text-2xl font-bold md:text-3xl text-center mb-4 mt-4'>{dashConfig?.statsTitle || 'Participants Stats'}</h1>

          <div className='mb-6 flex flex-col gap-4 md:flex-row'>
            <ParticipantCountCard token={token} config={config} />
            <MiniPrizesCard token={token} />
            <CountdownCard quizSessions={quizSessions||[]} config={config} />
          </div>

          <div className='hidden md:block w-[100%]'>
            <WinnersCard quizSessions={quizSessions} />
          </div>

          <div className='space-y-4 md:hidden'>
            {quizSessions.map((session) => (
              <Card key={session.sessionNumber} className='bg-white/10 backdrop-blur-md border-white/20  shadow-md'>
                <CardContent className='pt-6'>
                  <h3 className='mb-2 text-lg font-semibold'>Session {session.sessionNumber}</h3>
                  {session.winners.length === 0 ? (
                    <p className='text-muted-foreground'>No winners for this session.</p>
                  ) : (
                    <ul className='list-none space-y-2'>
                      {session.winners.map((winner, index) => (
                          <div
                            key={index}
                            className='flex flex-col items-center justify-center text-center space-y-2'
                          >
                            <div className='flex items-center gap-2'>
                              <IconTrophy className='text-primary h-4 w-4' />
                              <span>{winner.name}</span>

                            </div>
                              <span>{winner.phone}</span>
                          
                            <div className='relative h-32 w-32'>
                              <Image
                                src={"https://shandaarbuy.pk/cdn/shop/files/Redmi_Watch_4_Xiaomi_Global_Smart_Watch.jpg?v=1724945719"}
                                alt={"prize"}
                                fill
                                className='rounded-lg object-cover shadow-md'
                              />
                            </div>
                          </div>                     
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
