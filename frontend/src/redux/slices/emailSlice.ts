import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface EmailLog {
  _id: string;
  recipient_email: string;
  subject: string;
  content: string;
  status: 'success' | 'failed';
  error_message?: string;
  sent_at: string;
  createdAt: string;
}

interface EmailState {
  logs: EmailLog[];
  totalLogs: number;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  currentPage: number;
  resumes: string[];
}

const initialState: EmailState = {
  logs: [],
  totalLogs: 0,
  loading: false,
  error: null,
  successMessage: null,
  currentPage: 1,
  resumes: [],
};

export const sendBulkEmail = createAsyncThunk(
  'email/sendBulk',
  async (data: { emails: string[]; subject: string; content: string; resumeFilename?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/email/send-bulk`, data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send emails');
    }
  }
);

export const fetchLogs = createAsyncThunk(
  'email/fetchLogs',
  async ({ page, limit, search }: { page: number; limit: number; search?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/email/logs`, {
        params: { page, limit, search },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch logs');
    }
  }
);

export const fetchResumes = createAsyncThunk(
  'email/fetchResumes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/email/resumes`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch resumes');
    }
  }
);

const emailSlice = createSlice({
  name: 'email',
  initialState,
  reducers: {
    clearStatus: (state) => {
      state.successMessage = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Send Bulk Email
      .addCase(sendBulkEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendBulkEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = `Successfully processed ${action.payload.total} emails. Success: ${action.payload.successCount}, Failed: ${action.payload.failureCount}`;
      })
      .addCase(sendBulkEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Logs
      .addCase(fetchLogs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload.logs;
        state.totalLogs = action.payload.total;
        state.currentPage = action.payload.page;
      })
      .addCase(fetchLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Resumes
      .addCase(fetchResumes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchResumes.fulfilled, (state, action) => {
        state.loading = false;
        state.resumes = action.payload;
      })
      .addCase(fetchResumes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearStatus } = emailSlice.actions;
export default emailSlice.reducer;
