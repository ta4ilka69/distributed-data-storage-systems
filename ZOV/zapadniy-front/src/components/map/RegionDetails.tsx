import React, { useState } from "react";
import { Region, SocialStatus } from "../../types";
import {
  ExclamationTriangleIcon,
  UserGroupIcon,
  MagnifyingGlassCircleIcon,
  UserIcon,
  RocketLaunchIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";

interface RegionDetailsProps {
  region: Region | null;
  isGovernmentUser: boolean;
  onLaunchMissile: (regionId: string) => Promise<void>;
  onNavigateToParent?: () => void;
}

const RegionDetails: React.FC<RegionDetailsProps> = ({
  region,
  isGovernmentUser,
  onLaunchMissile,
  onNavigateToParent,
}) => {
  const [launchRequested, setLaunchRequested] = useState(false);
  const [launchConfirmed, setLaunchConfirmed] = useState(false);
  const [launchInProgress, setLaunchInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!region) {
    return (
      <div className="card p-6 h-full flex flex-col items-center justify-center text-gray-500">
        <MagnifyingGlassCircleIcon className="h-12 w-12 mb-4" />
        <p>Select a region on the map to see details</p>
      </div>
    );
  }

  const handleRequestLaunch = () => {
    setLaunchRequested(true);
    setError(null);
  };

  const handleCancelLaunch = () => {
    setLaunchRequested(false);
    setError(null);
  };

  const handleConfirmLaunch = async () => {
    setLaunchConfirmed(true);
    setLaunchInProgress(true);

    try {
      await onLaunchMissile(region.id || "");
      // Launch successful
      setTimeout(() => {
        setLaunchInProgress(false);
      }, 3000); // Simulate launch taking some time
    } catch (err) {
      setError("Failed to launch missile. Please try again.");
      setLaunchInProgress(false);
      setLaunchConfirmed(false);
    }
  };

  const canLaunchMissile = isGovernmentUser && region.underThreat;

  const getSocialRatingColor = (rating: number) => {
    if (rating < 30) return "text-red-600";
    if (rating < 70) return "text-yellow-600";
    return "text-green-600";
  };

  const isEliminated = region.populationCount === 0;
  const regionStyle = isEliminated ? 
    { backgroundColor: 'rgba(0, 0, 0, 0.9)', color: '#ff0000', borderRadius: '0.5rem', border: '2px solid #ff0000' } : 
    {};

  return (
    <div className="card p-6" style={regionStyle}>
      <div className="flex justify-between items-center border-b pb-3 mb-4" style={{ borderColor: isEliminated ? '#ff0000' : '' }}>
        <h2 className="text-xl font-bold" style={{ color: isEliminated ? '#ff0000' : '#1f2937' }}>
          {region.name} - {region.type}
          {isEliminated && <span className="ml-2 text-red-600 animate-pulse">⚠ ELIMINATED ⚠</span>}
        </h2>

        {region.parentRegionId && onNavigateToParent && (
          <button
            onClick={onNavigateToParent}
            className={`flex items-center text-sm ${isEliminated ? 'text-red-400 hover:text-red-300' : 'text-blue-600 hover:text-blue-800'}`}
          >
            <ArrowUpIcon className="h-4 w-4 mr-1" />
            Up to Parent
          </button>
        )}
      </div>

      <div className="space-y-4">
        {isEliminated ? (
          <div className="bg-black p-4 rounded-md text-center">
            <p className="font-bold text-red-500 text-lg mb-2">REGION ELIMINATED</p>
            <p className="text-gray-400">
              This region has been destroyed by an ORESHNIK missile strike.
              All inhabitants have been eliminated.
            </p>
            <div className="mt-4 border-t border-red-800 pt-4">
              <p className="text-gray-500 text-sm">Previous population: Unknown</p>
              <p className="text-gray-500 text-sm">Current population: 0</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center">
              <UserGroupIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-gray-700">Population: </span>
              <span className="font-medium ml-1">
                {region.populationCount.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center">
              <UserIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-gray-700">Important Persons: </span>
              <span className="font-medium ml-1">
                {region.importantPersonsCount}
              </span>
            </div>

            <div>
              <div className="flex items-center mb-1">
                <span className="text-gray-700">Average Social Rating: </span>
                <span
                  className={`font-bold ml-1 ${getSocialRatingColor(
                    region.averageSocialRating
                  )}`}
                >
                  {region.averageSocialRating.toFixed(1)}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    region.averageSocialRating < 30
                      ? "bg-red-500"
                      : region.averageSocialRating < 70
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(100, region.averageSocialRating)}%` }}
                ></div>
              </div>
            </div>
          </>
        )}

        {region.underThreat && !isEliminated && (
          <div className="bg-red-100 p-3 rounded-md flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
            <div>
              <p className="font-medium text-red-700">Region Under Threat</p>
              <p className="text-sm text-red-600">
                Low social rating detected. ORESHNIK missile deployment authorized.
              </p>
            </div>
          </div>
        )}

        {isGovernmentUser && !isEliminated && (
          <div className="border-t mt-4 pt-4">
            <h3 className="font-bold text-gray-800 mb-2">
              Government Controls
            </h3>

            {canLaunchMissile ? (
              <div>
                {!launchRequested && !launchConfirmed && (
                  <button
                    className="btn-danger w-full flex items-center justify-center gap-2"
                    onClick={handleRequestLaunch}
                  >
                    <RocketLaunchIcon className="h-5 w-5" />
                    <span>Launch ORESHNIK Missile</span>
                  </button>
                )}

                {launchRequested && !launchConfirmed && (
                  <div className="space-y-3">
                    <div className="bg-red-100 p-3 rounded-md">
                      <p className="font-bold text-red-700">
                        WARNING: MISSILE LAUNCH CONFIRMATION
                      </p>
                      <p className="text-sm text-red-600 mt-1">
                        You are about to launch an ORESHNIK missile at{" "}
                        {region.name}. This will destroy the region and all
                        citizens within it. This action cannot be undone.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn-secondary flex-1"
                        onClick={handleCancelLaunch}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-danger flex-1 flex items-center justify-center gap-1"
                        onClick={handleConfirmLaunch}
                      >
                        <RocketLaunchIcon className="h-4 w-4" />
                        <span>Confirm Launch</span>
                      </button>
                    </div>
                  </div>
                )}

                {launchConfirmed && (
                  <div className="space-y-3">
                    {launchInProgress ? (
                      <div className="bg-red-100 p-4 rounded-md flex flex-col items-center">
                        <div className="animate-pulse flex items-center mb-2">
                          <RocketLaunchIcon className="h-6 w-6 text-red-600 mr-2" />
                          <span className="font-bold text-red-700">
                            MISSILE LAUNCH IN PROGRESS
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="h-2 bg-red-600 rounded-full animate-[progress_3s_ease-in-out_infinite]"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-100 p-4 rounded-md text-center">
                        <p className="font-bold text-red-700">
                          MISSILE LAUNCHED SUCCESSFULLY
                        </p>
                        <p className="text-sm text-red-600 mt-1">
                          ORESHNIK missile has been launched at {region.name}.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="mt-3 bg-red-100 p-3 rounded-md text-red-700 text-sm">
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="text-gray-700 font-medium">
                  Missile Launch Unavailable
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Region social rating is too high ({region.averageSocialRating.toFixed(1)}).
                  {region.importantPersonsCount > 0 && 
                    ` Region contains ${region.importantPersonsCount} important persons who must be protected.`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionDetails;
