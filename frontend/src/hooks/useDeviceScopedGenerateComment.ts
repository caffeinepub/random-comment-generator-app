import { useGetNextCommentForDevice } from './useQueries';

// Re-export the real implementation
export { useGetNextCommentForDevice as useDeviceScopedGenerateComment };

export default useGetNextCommentForDevice;
