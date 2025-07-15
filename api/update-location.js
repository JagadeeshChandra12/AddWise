const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Use your project URL and service role key
const supabase = createClient(
  'https://tdylojqfgcchpfdbroaq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeWxvanFmZ2NjaHBmZGJyb2FxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAwODM3NywiZXhwIjoyMDYzNTg0Mzc3fQ.0eX0zjBBwp2iLLtV4XQomgMTa1-P0gCItKEpAVmN2tQ'
);

app.post('/update-location', async (req, res) => {
  const { device_code, latitude, longitude } = req.body;

  // Validate input
  if (!device_code || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ status: 'error', message: 'Invalid input.' });
  }

  // Insert into device_locations
  const { error: insertError } = await supabase
    .from('device_locations')
    .insert([{ device_code, latitude, longitude, timestamp: new Date().toISOString() }]);
  if (insertError) {
    console.error('Insert error:', insertError);
    return res.status(500).json({ status: 'error', message: insertError.message || 'Failed to insert location.' });
  }

  // Update latest location in device_codes
  const { error: updateError } = await supabase
    .from('device_codes')
    .update({ assigned_lat: latitude, assigned_lng: longitude })
    .eq('code', device_code);
  if (updateError) {
    return res.status(500).json({ status: 'error', message: 'Failed to update device.' });
  }

  res.json({ status: 'success', message: 'Location updated.' });
});

app.post('/update-location-and-get-info', async (req, res) => {
  const { device_code, latitude, longitude } = req.body;

  // Validate input
  if (!device_code || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ status: 'error', message: 'Invalid input.' });
  }

  // Insert into device_locations
  const { error: insertError } = await supabase
    .from('device_locations')
    .insert([{ device_code, latitude, longitude, timestamp: new Date().toISOString() }]);
  if (insertError) {
    console.error('Insert error:', insertError);
    return res.status(500).json({ status: 'error', message: insertError.message || 'Failed to insert location.' });
  }

  // Update latest location in device_codes
  const { error: updateError } = await supabase
    .from('device_codes')
    .update({ assigned_lat: latitude, assigned_lng: longitude })
    .eq('code', device_code);
  if (updateError) {
    return res.status(500).json({ status: 'error', message: 'Failed to update device.' });
  }

  // Fetch latest lat/lng and status from device_codes
  const { data: device, error: deviceError } = await supabase
    .from('device_codes')
    .select('code, status, assigned_lat, assigned_lng')
    .eq('code', device_code)
    .single();
  if (deviceError || !device) {
    return res.status(404).json({ status: 'error', message: 'Device not found.' });
  }

  // Fetch location history from device_locations
  const { data: locations, error: locError } = await supabase
    .from('device_locations')
    .select('latitude, longitude, timestamp')
    .eq('device_code', device_code)
    .order('timestamp', { ascending: true });
  if (locError) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch location history.' });
  }

  res.json({
    status: 'success',
    device: {
      code: device.code,
      status: device.status,
      latest_lat: Number(device.assigned_lat).toFixed(4),
      latest_lng: Number(device.assigned_lng).toFixed(4)
    }
  });
});

app.get('/get-device-info', async (req, res) => {
  const { device_code } = req.query;
  if (!device_code) {
    return res.status(400).json({ status: 'error', message: 'Missing device_code.' });
  }

  // Fetch latest lat/lng and status from device_codes
  const { data: device, error: deviceError } = await supabase
    .from('device_codes')
    .select('code, status, assigned_lat, assigned_lng')
    .eq('code', device_code)
    .single();
  if (deviceError || !device) {
    return res.status(404).json({ status: 'error', message: 'Device not found.' });
  }

  // Fetch location history from device_locations
  const { data: locations, error: locError } = await supabase
    .from('device_locations')
    .select('latitude, longitude, timestamp')
    .eq('device_code', device_code)
    .order('timestamp', { ascending: true });
  if (locError) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch location history.' });
  }

  res.json({
    status: 'success',
    device: {
      code: device.code,
      status: device.status,
      latest_lat: device.assigned_lat,
      latest_lng: device.assigned_lng,
      locations: locations || []
    }
  });
});

app.get('/get-location', async (req, res) => {
  const { device_code } = req.query;
  if (!device_code) {
    return res.status(400).json({ status: 'error', message: 'Missing device_code.' });
  }
  const { data: device, error } = await supabase
    .from('device_codes')
    .select('code, assigned_lat, assigned_lng')
    .eq('code', device_code)
    .single();
  if (error || !device) {
    return res.status(404).json({ status: 'error', message: 'Device not found.' });
  }
  res.json({
    status: 'success',
    device_code: device.code,
    latitude: device.assigned_lat,
    longitude: device.assigned_lng
  });
});

app.get('/get-locations', async (req, res) => {
  const { device_code } = req.query;
  if (!device_code) {
    return res.status(400).json({ status: 'error', message: 'Missing device_code.' });
  }
  const { data: locations, error } = await supabase
    .from('device_locations')
    .select('latitude, longitude, timestamp')
    .eq('device_code', device_code)
    .order('timestamp', { ascending: true });
  if (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch locations.' });
  }
  res.json({
    status: 'success',
    device_code,
    locations: (locations || []).map(loc => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
      timestamp: new Date(loc.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    }))
  });
});

app.listen(4000, () => console.log('API running on http://localhost:4000')); 