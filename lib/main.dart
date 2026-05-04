import 'dart:async';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:file_picker/file_picker.dart';

void main() => runApp(const MaterialApp(
  title: 'Looper Player',
  themeMode: ThemeMode.dark,
  home: SimpleAudioPlayer(),
));

class SimpleAudioPlayer extends StatefulWidget {
  const SimpleAudioPlayer({super.key});

  @override
  State<SimpleAudioPlayer> createState() => _SimpleAudioPlayerState();
}

class _SimpleAudioPlayerState extends State<SimpleAudioPlayer> {
  final AudioPlayer _audioPlayer = AudioPlayer();
  
  String? _filePath;
  int _repeats = 3;
  int _gapSeconds = 2;
  
  bool _isPlaying = false;
  int _currentIteration = 0;
  bool _shouldStop = false;

  @override
  void dispose() {
    _audioPlayer.dispose();
    super.dispose();
  }

  Future<void> _pickFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(type: FileType.audio);
    if (result != null) {
      setState(() {
        _filePath = result.files.single.path;
      });
    }
  }

  Future<void> _startPlayback() async {
    if (_filePath == null) return;

    setState(() {
      _isPlaying = true;
      _shouldStop = false;
      _currentIteration = 0;
    });

    for (int i = 0; i < _repeats; i++) {
      if (_shouldStop) break;

      setState(() => _currentIteration = i + 1);

      // Play the file
      await _audioPlayer.play(DeviceFileSource(_filePath!));

      // Wait for audio to finish
      await _audioPlayer.onPlayerComplete.first;

      // If not the last repetition, wait for the gap
      if (i < _repeats - 1 && !_shouldStop) {
        await Future.delayed(Duration(seconds: _gapSeconds));
      }
    }

    setState(() {
      _isPlaying = false;
      _currentIteration = 0;
    });
  }

  void _stopPlayback() {
    _shouldStop = true;
    _audioPlayer.stop();
    setState(() => _isPlaying = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Looper Player")),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            ElevatedButton.icon(
              onPressed: _pickFile,
              icon: const Icon(Icons.audio_file),
              label: Text(_filePath == null ? "Pick Audio File" : "File Selected"),
            ),
            if (_filePath != null) ...[
              const SizedBox(height: 8),
              Text(_filePath!.split('/').last, style: const TextStyle(fontWeight: FontWeight.bold)),
            ],
            const Divider(height: 40),
            
            // Repeat Input
            TextField(
              decoration: const InputDecoration(labelText: "Repeat X times"),
              keyboardType: TextInputType.number,
              onChanged: (val) => _repeats = int.tryParse(val) ?? 1,
            ),
            
            // Gap Input
            TextField(
              decoration: const InputDecoration(labelText: "Gap (Y seconds)"),
              keyboardType: TextInputType.number,
              onChanged: (val) => _gapSeconds = int.tryParse(val) ?? 0,
            ),
            
            const SizedBox(height: 30),
            
            if (_isPlaying) ...[
              Text("Playing iteration $_currentIteration of $_repeats"),
              const SizedBox(height: 10),
              const LinearProgressIndicator(),
            ],
            
            const Spacer(),
            
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  iconSize: 64,
                  icon: Icon(_isPlaying ? Icons.stop_circle : Icons.play_circle),
                  color: _isPlaying ? Colors.red : Colors.green,
                  onPressed: _filePath == null 
                    ? null 
                    : (_isPlaying ? _stopPlayback : _startPlayback),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}
