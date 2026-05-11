import { useState, useEffect, type FC } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Grid,
  Paper,
  Divider,
  Stack,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { Add, Delete, Send, Visibility, Refresh, AttachFile } from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../redux/store';
import { sendBulkEmail, clearStatus, fetchResumes } from '../redux/slices/emailSlice';

const schema = yup.object().shape({
  emails: yup
    .array()
    .of(
      yup.object().shape({
        value: yup.string().email('Invalid email').required('Required'),
      })
    )
    .min(1, 'At least one recipient is required')
    .max(10, 'Maximum 10 recipients allowed')
    .test('unique', 'Duplicate emails are not allowed', (emails) => {
      if (!emails) return true;
      const values = emails.map((e) => e.value);
      return new Set(values).size === values.length;
    }),
  subject: yup.string().required('Subject is required'),
  content: yup.string().required('Email content is required'),
  resumeFilename: yup.string().optional(),
});

const ComposeEmail: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, successMessage, resumes } = useSelector((state: RootState) => state.email);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchResumes());
  }, [dispatch]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      emails: [{ value: '' }],
      subject: '',
      content: '',
      resumeFilename: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'emails',
  });

  const onSubmit = (data: any) => {
    const formattedData = {
      emails: data.emails.map((e: any) => e.value),
      subject: data.subject,
      content: data.content,
      resumeFilename: data.resumeFilename || undefined,
    };
    dispatch(sendBulkEmail(formattedData));
  };

  const handleReset = () => {
    reset({
      emails: [{ value: '' }],
      subject: '',
      content: '',
      resumeFilename: '',
    });
    dispatch(clearStatus());
  };

  const watchedContent = watch('content');
  const watchedSubject = watch('subject');

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3} {...({} as any)}>
        {/* Left Panel: Recipients & Subject */}
        <Grid item xs={12} md={5} {...({} as any)}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recipients
            </Typography>
            <Box sx={{ maxHeight: '400px', overflowY: 'auto', mb: 2, pr: 1 }}>
              <Stack spacing={2}>
                {fields.map((item, index) => (
                  <Box key={item.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <Controller
                      name={`emails.${index}.value` as const}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          size="small"
                          label={`Recipient #${index + 1}`}
                          error={!!errors.emails?.[index]?.value}
                          helperText={errors.emails?.[index]?.value?.message}
                        />
                      )}
                    />
                    <IconButton 
                      onClick={() => remove(index)} 
                      disabled={fields.length === 1}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            </Box>

            {fields.length < 10 && (
              <Button
                startIcon={<Add />}
                onClick={() => append({ value: '' })}
                variant="outlined"
                fullWidth
                sx={{ marginBottom: 3 } as any}
              >
                Add Recipient
              </Button>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Message Details
            </Typography>
            <Controller
              name="subject"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Subject"
                  error={!!errors.subject}
                  helperText={errors.subject?.message}
                  slotProps={{
                    input: {
                      placeholder: "Enter email subject",
                    }
                  }}
                  sx={{ marginBottom: 3 } as any}
                />
              )}
            />

            <Typography variant="h6" gutterBottom>
              Attachments
            </Typography>
            <Controller
              name="resumeFilename"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small" sx={{ mb: 3 } as any}>
                  <InputLabel id="resume-select-label">Select Resume (Optional)</InputLabel>
                  <Select
                    {...field}
                    labelId="resume-select-label"
                    label="Select Resume (Optional)"
                    startAdornment={<AttachFile sx={{ mr: 1, ml: -0.5, fontSize: 20 }} />}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {resumes.map((resume) => (
                      <MenuItem key={resume} value={resume}>
                        {resume}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Select a resume to attach to the emails</FormHelperText>
                </FormControl>
              )}
            />

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                onClick={handleSubmit(onSubmit)}
                disabled={loading || !isValid}
                fullWidth
              >
                {loading ? 'Sending...' : 'Send Bulk Email'}
              </Button>
              <IconButton onClick={() => setPreviewOpen(true)} color="primary" disabled={!watchedContent}>
                <Visibility />
              </IconButton>
              <IconButton onClick={handleReset} color="secondary">
                <Refresh />
              </IconButton>
            </Stack>
          </Paper>
        </Grid>

        {/* Right Panel: Rich Text Editor */}
        <Grid item xs={12} md={7} {...({} as any)}>
          <Paper sx={{ p: 3, height: '100%', minHeight: '600px' }}>
            <Typography variant="h6" gutterBottom>
              Email Content
            </Typography>
            <Box sx={{ height: 'calc(100% - 40px)' }}>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <ReactQuill
                    theme="snow"
                    value={field.value}
                    onChange={field.onChange}
                    style={{ height: '450px', marginBottom: '50px' }}
                  />
                )}
              />
              {errors.content && (
                <Typography color="error" variant="caption">
                  {errors.content.message}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Email Preview</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Subject: {watchedSubject || '(No Subject)'}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box dangerouslySetInnerHTML={{ __html: watchedContent }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={() => dispatch(clearStatus())}>
        <Alert onClose={() => dispatch(clearStatus())} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => dispatch(clearStatus())}>
        <Alert onClose={() => dispatch(clearStatus())} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ComposeEmail;
